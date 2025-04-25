<?php
header('Content-Type: application/json');
require_once 'config.php';

// Get the request method and action
$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// Handle CORS if needed
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    exit(0);
}

// Function to send JSON response
function sendResponse($success, $data = null, $message = '') {
    echo json_encode([
        'success' => $success,
        'data' => $data,
        'message' => $message
    ]);
    exit;
}

// Handle different actions
try {
    switch ($action) {
        case 'getTasks':
            getTasks();
            break;

        case 'getTaskDetail':
            getTaskDetail();
            break;

        case 'addTask':
            addTask();
            break;

        case 'toggleTask':
            toggleTask();
            break;

        case 'deleteTask':
            deleteTask();
            break;

        case 'getCategories':
            getCategories();
            break;

        case 'addCategory':
            if ($method !== 'POST') {
                sendResponse(false, null, 'Invalid request method');
            }
            addCategory();
            break;

        case 'getStatistics':
            getStatistics();
            break;

        case 'exportCSV':
            exportCSV();
            break;

        default:
            sendResponse(false, null, 'Invalid action');
            break;
    }
} catch (Exception $e) {
    error_log("Error in todo_handler: " . $e->getMessage());
    sendResponse(false, null, 'An error occurred while processing your request');
}

// Function to get tasks with filters
function getTasks() {
    global $pdo;
    
    $where = ['1=1'];
    $params = [];

    // Apply filters
    if (!empty($_GET['priority'])) {
        $where[] = 'priority = ?';
        $params[] = $_GET['priority'];
    }

    if (!empty($_GET['status'])) {
        $where[] = 'is_completed = ?';
        $params[] = $_GET['status'] === 'completed' ? 1 : 0;
    }

    if (!empty($_GET['date_range'])) {
        $dates = explode(' to ', $_GET['date_range']);
        if (count($dates) === 2) {
            $where[] = 'due_date BETWEEN ? AND ?';
            $params[] = $dates[0] . ' 00:00:00';
            $params[] = $dates[1] . ' 23:59:59';
        }
    }

    if (!empty($_GET['search'])) {
        $where[] = 'title LIKE ?';
        $params[] = '%' . $_GET['search'] . '%';
    }

    $sql = "SELECT t.*, c.name as category_name, c.color as category_color 
            FROM tasks t 
            LEFT JOIN categories c ON t.category_id = c.id 
            WHERE " . implode(' AND ', $where) . " 
            ORDER BY t.created_at DESC";

    $stmt = $pdo->prepare($sql);
    $stmt->execute($params);
    
    echo json_encode(['success' => true, 'tasks' => $stmt->fetchAll()]);
}

// Function to get detailed task information
function getTaskDetail() {
    global $pdo;
    
    $taskId = $_GET['id'] ?? null;
    if (!$taskId) {
        echo json_encode(['success' => false, 'message' => 'Task ID is required']);
        return;
    }

    // Get task details
    $stmt = $pdo->prepare("
        SELECT t.*, c.name as category_name, c.color as category_color 
        FROM tasks t 
        LEFT JOIN categories c ON t.category_id = c.id 
        WHERE t.id = ?
    ");
    $stmt->execute([$taskId]);
    $task = $stmt->fetch();

    if (!$task) {
        echo json_encode(['success' => false, 'message' => 'Task not found']);
        return;
    }

    // Get subtasks
    $stmt = $pdo->prepare("SELECT * FROM subtasks WHERE task_id = ?");
    $stmt->execute([$taskId]);
    $task['subtasks'] = $stmt->fetchAll();

    // Get comments
    $stmt = $pdo->prepare("SELECT * FROM comments WHERE task_id = ? ORDER BY created_at DESC");
    $stmt->execute([$taskId]);
    $task['comments'] = $stmt->fetchAll();

    // Get time tracking
    $stmt = $pdo->prepare("
        SELECT SUM(COALESCE(duration, TIMESTAMPDIFF(SECOND, start_time, COALESCE(end_time, NOW())))) as total_seconds 
        FROM time_tracking 
        WHERE task_id = ?
    ");
    $stmt->execute([$taskId]);
    $timeTracking = $stmt->fetch();
    $task['time_spent'] = $timeTracking['total_seconds'] ?? 0;

    echo json_encode(['success' => true, 'task' => $task]);
}

// Function to add a new task
function addTask() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['title'])) {
        echo json_encode(['success' => false, 'message' => 'Title is required']);
        return;
    }

    $stmt = $pdo->prepare("
        INSERT INTO tasks (title, category_id, priority, due_date) 
        VALUES (?, ?, ?, ?)
    ");
    
    $stmt->execute([
        $data['title'],
        $data['category_id'],
        $data['priority'],
        $data['due_date']
    ]);

    echo json_encode(['success' => true, 'task_id' => $pdo->lastInsertId()]);
}

// Function to toggle task completion
function toggleTask() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['id'])) {
        echo json_encode(['success' => false, 'message' => 'Task ID is required']);
        return;
    }

    $stmt = $pdo->prepare("
        UPDATE tasks 
        SET is_completed = NOT is_completed 
        WHERE id = ?
    ");
    
    $stmt->execute([$data['id']]);
    echo json_encode(['success' => true]);
}

// Function to delete a task
function deleteTask() {
    global $pdo;
    
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (empty($data['id'])) {
        echo json_encode(['success' => false, 'message' => 'Task ID is required']);
        return;
    }

    $stmt = $pdo->prepare("DELETE FROM tasks WHERE id = ?");
    $stmt->execute([$data['id']]);
    
    echo json_encode(['success' => true]);
}

// Function to get categories
function getCategories() {
    global $pdo;
    
    try {
        $stmt = $pdo->query("
            SELECT c.*, COUNT(t.id) as task_count 
            FROM categories c 
            LEFT JOIN tasks t ON c.id = t.category_id 
            GROUP BY c.id
            ORDER BY c.name ASC
        ");
        
        $categories = $stmt->fetchAll();
        sendResponse(true, ['categories' => $categories]);
    } catch (PDOException $e) {
        error_log("Database error in getCategories: " . $e->getMessage());
        sendResponse(false, null, 'Failed to load categories');
    }
}

// Function to add a new category
function addCategory() {
    global $pdo;
    
    try {
        $data = json_decode(file_get_contents('php://input'), true);
        
        if (!isset($data['name']) || trim($data['name']) === '') {
            sendResponse(false, null, 'Category name is required');
        }

        // Validate color format
        if (!isset($data['color']) || !preg_match('/^#[a-fA-F0-9]{6}$/', $data['color'])) {
            $data['color'] = '#3498db'; // Default color if invalid
        }

        // Check if category name already exists
        $stmt = $pdo->prepare("SELECT id FROM categories WHERE name = ?");
        $stmt->execute([trim($data['name'])]);
        if ($stmt->fetch()) {
            sendResponse(false, null, 'A category with this name already exists');
        }

        // Insert new category
        $stmt = $pdo->prepare("INSERT INTO categories (name, color) VALUES (?, ?)");
        $stmt->execute([trim($data['name']), $data['color']]);
        
        sendResponse(true, ['category_id' => $pdo->lastInsertId()], 'Category added successfully');
    } catch (PDOException $e) {
        error_log("Database error in addCategory: " . $e->getMessage());
        sendResponse(false, null, 'Failed to add category');
    }
}

// Function to get statistics
function getStatistics() {
    global $pdo;
    
    $stats = [];

    // Get total counts
    $stmt = $pdo->query("
        SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN is_completed = 1 THEN 1 ELSE 0 END) as completed,
            SUM(CASE WHEN is_completed = 0 THEN 1 ELSE 0 END) as pending,
            SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority,
            SUM(CASE WHEN priority = 'medium' THEN 1 ELSE 0 END) as medium_priority,
            SUM(CASE WHEN priority = 'low' THEN 1 ELSE 0 END) as low_priority
        FROM tasks
    ");
    
    $stats = $stmt->fetch();
    
    echo json_encode(['success' => true, 'statistics' => $stats]);
}

// Function to export tasks as CSV
function exportCSV() {
    global $pdo;
    
    header('Content-Type: text/csv');
    header('Content-Disposition: attachment; filename="tasks.csv"');
    
    $output = fopen('php://output', 'w');
    
    // Add headers
    fputcsv($output, ['Title', 'Category', 'Priority', 'Due Date', 'Status', 'Created At']);
    
    // Get tasks
    $stmt = $pdo->query("
        SELECT t.title, c.name as category, t.priority, t.due_date, 
               CASE WHEN t.is_completed THEN 'Completed' ELSE 'Pending' END as status,
               t.created_at
        FROM tasks t
        LEFT JOIN categories c ON t.category_id = c.id
        ORDER BY t.created_at DESC
    ");
    
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, $row);
    }
    
    fclose($output);
    exit;
} 
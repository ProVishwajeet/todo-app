<?php
$host = 'localhost';
$root_user = 'root';
$root_password = 'root'; // Default MAMP root password

try {
    // Connect as root
    $pdo = new PDO(
        "mysql:host=$host",
        $root_user,
        $root_password,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]
    );

    // Create database
    $pdo->exec("CREATE DATABASE IF NOT EXISTS todo_db");
    
    // Create user and grant privileges
    $pdo->exec("CREATE USER IF NOT EXISTS 'todo_user'@'localhost' IDENTIFIED BY 'todo_password'");
    $pdo->exec("GRANT ALL PRIVILEGES ON todo_db.* TO 'todo_user'@'localhost'");
    $pdo->exec("FLUSH PRIVILEGES");

    echo "Database and user created successfully!<br>";
    
    // Include the table setup
    require_once 'includes/setup.php';
    
} catch (PDOException $e) {
    die("Setup failed: " . $e->getMessage());
} 
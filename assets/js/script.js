$(document).ready(function() {
    // Initialize Flatpickr for date inputs
    flatpickr("#taskDueDate", {
        enableTime: true,
        dateFormat: "Y-m-d H:i",
        minDate: "today"
    });

    flatpickr("#dateRange", {
        mode: "range",
        dateFormat: "Y-m-d"
    });

    // Theme Toggle
    $('#themeToggle').on('click', function() {
        $('body').attr('data-theme', 
            $('body').attr('data-theme') === 'dark' ? 'light' : 'dark'
        );
        $(this).find('i').toggleClass('fa-moon fa-sun');
        localStorage.setItem('theme', $('body').attr('data-theme'));
    });

    // Load saved theme
    if (localStorage.getItem('theme') === 'dark') {
        $('body').attr('data-theme', 'dark');
        $('#themeToggle i').removeClass('fa-moon').addClass('fa-sun');
    }

    // View Toggle
    $('#viewToggle').on('click', function() {
        $('#taskList').toggleClass('grid-view');
        $(this).find('i').toggleClass('fa-th-list fa-th');
        localStorage.setItem('view', $('#taskList').hasClass('grid-view') ? 'grid' : 'list');
    });

    // Load saved view
    if (localStorage.getItem('view') === 'grid') {
        $('#taskList').addClass('grid-view');
        $('#viewToggle i').removeClass('fa-th-list').addClass('fa-th');
    }

    // Load Categories
    function loadCategories() {
        fetch('includes/todo_handler.php?action=getCategories')
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(result => {
                if (!result.success) {
                    throw new Error(result.message || 'Failed to load categories');
                }

                // Update category select dropdown
                const categorySelect = document.getElementById('taskCategory');
                const categoryList = document.getElementById('categoryList');
                
                if (!categorySelect || !categoryList) {
                    console.error('Category elements not found');
                    return;
                }

                // Clear existing options and list
                categorySelect.innerHTML = '<option value="">Select Category</option>';
                categoryList.innerHTML = '';
                
                const categories = result.data?.categories || [];
                if (categories.length > 0) {
                    categories.forEach(category => {
                        // Add to select dropdown
                        const option = document.createElement('option');
                        option.value = category.id;
                        option.textContent = category.name;
                        option.style.color = category.color;
                        categorySelect.appendChild(option);
                        
                        // Add to sidebar category list
                        const listItem = document.createElement('a');
                        listItem.href = '#';
                        listItem.className = 'list-group-item list-group-item-action category-item d-flex justify-content-between align-items-center';
                        listItem.dataset.id = category.id;
                        listItem.style.borderLeft = `4px solid ${category.color}`;
                        listItem.innerHTML = `
                            ${category.name}
                            <span class="badge bg-primary rounded-pill">${category.task_count || 0}</span>
                        `;
                        categoryList.appendChild(listItem);
                    });
                } else {
                    categoryList.innerHTML = '<div class="text-muted p-3">No categories found</div>';
                }
            })
            .catch(error => {
                console.error('Error loading categories:', error);
                showAlert(error.message || 'Failed to load categories', 'danger');
            });
    }

    // Load Statistics
    function loadStatistics() {
        $.get('includes/todo_handler.php?action=getStatistics', function(response) {
            if (response.success) {
                const stats = response.statistics;
                $('#taskStats').html(`
                    <div class="stat-card">
                        <h6>Total Tasks</h6>
                        <h3>${stats.total}</h3>
                    </div>
                    <div class="stat-card">
                        <h6>Completed</h6>
                        <h3>${stats.completed}</h3>
                    </div>
                    <div class="stat-card">
                        <h6>Pending</h6>
                        <h3>${stats.pending}</h3>
                    </div>
                    <canvas id="priorityChart"></canvas>
                `);

                // Create priority distribution chart
                new Chart($('#priorityChart'), {
                    type: 'doughnut',
                    data: {
                        labels: ['High', 'Medium', 'Low'],
                        datasets: [{
                            data: [stats.high_priority, stats.medium_priority, stats.low_priority],
                            backgroundColor: ['#dc3545', '#ffc107', '#28a745']
                        }]
                    },
                    options: {
                        responsive: true,
                        plugins: {
                            legend: {
                                position: 'bottom'
                            }
                        }
                    }
                });
            }
        });
    }

    // Load Tasks
    function loadTasks(filters = {}) {
        $.get('includes/todo_handler.php?action=getTasks', filters, function(response) {
            if (response.success) {
                const taskList = $('#taskList');
                taskList.empty();

                response.tasks.forEach(task => {
                    const dueDate = new Date(task.due_date);
                    const now = new Date();
                    const isDueSoon = dueDate - now < 24 * 60 * 60 * 1000; // 24 hours
                    const isOverdue = dueDate < now;

                    taskList.append(`
                        <div id="task-${task.id}" class="task-item new-task card mb-3 ${task.completed ? 'completed' : ''} ${task.priority}-priority">
                            <div class="card-body">
                                <div class="d-flex justify-content-between align-items-center">
                                    <h5 class="card-title task-title mb-0">${task.title}</h5>
                                    <div class="task-actions">
                                        <button class="btn btn-sm btn-outline-success toggle-complete" data-id="${task.id}">
                                            <i class="fas ${task.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-info task-detail" data-id="${task.id}">
                                            <i class="fas fa-info-circle"></i>
                                        </button>
                                        <button class="btn btn-sm btn-outline-danger delete-task" data-id="${task.id}">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </div>
                                <div class="mt-2">
                                    <span class="category-pill" style="background-color: ${task.category_color}">${task.category_name}</span>
                                    <span class="badge bg-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}">${task.priority}</span>
                                    ${task.due_date ? `
                                        <span class="badge ${isOverdue ? 'bg-danger' : isDueSoon ? 'bg-warning' : 'bg-info'}">
                                            <i class="far fa-clock"></i> ${formatDate(task.due_date)}
                                        </span>
                                    ` : ''}
                                </div>
                                ${task.description ? `<p class="card-text mt-2">${task.description}</p>` : ''}
                            </div>
                        </div>
                    `);
                });
            }
        });
    }

    // Add Task
    $('#addTaskForm').on('submit', function(e) {
        e.preventDefault();
        const taskData = {
            title: $('#taskTitle').val(),
            category_id: $('#taskCategory').val(),
            priority: $('#taskPriority').val(),
            due_date: $('#taskDueDate').val()
        };

        $.ajax({
            url: 'includes/todo_handler.php?action=addTask',
            method: 'POST',
            data: JSON.stringify(taskData),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    $('#taskTitle').val('');
                    $('#taskDueDate').val('');
                    loadTasks();
                    loadStatistics();
                    loadCategories();
                }
            }
        });
    });

    // Add Category
    const categoryForm = document.getElementById('categoryForm');
    if (categoryForm) {
        categoryForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const categoryName = document.getElementById('categoryName');
            const categoryColor = document.getElementById('categoryColor');
            
            if (!categoryName || !categoryColor) {
                showAlert('Category form elements not found', 'danger');
                return;
            }

            const name = categoryName.value.trim();
            const color = categoryColor.value;
            
            if (!name) {
                showAlert('Please enter a category name', 'danger');
                return;
            }
            
            const data = { name, color };
            
            fetch('includes/todo_handler.php?action=addCategory', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(result => {
                if (!result.success) {
                    throw new Error(result.message || 'Failed to add category');
                }

                showAlert(result.message || 'Category added successfully', 'success');
                categoryName.value = '';
                categoryColor.value = '#3498db';
                loadCategories();

                // Close modal
                const categoryModal = document.getElementById('categoryModal');
                if (categoryModal) {
                    const modal = bootstrap.Modal.getInstance(categoryModal);
                    if (modal) {
                        modal.hide();
                    }
                }
            })
            .catch(error => {
                console.error('Error:', error);
                showAlert(error.message || 'An error occurred while adding the category', 'danger');
            });
        });
    }

    // Toggle Task Completion
    $(document).on('click', '.toggle-complete', function() {
        const taskId = $(this).data('id');
        $.ajax({
            url: 'includes/todo_handler.php?action=toggleTask',
            method: 'POST',
            data: JSON.stringify({ id: taskId }),
            contentType: 'application/json',
            success: function(response) {
                if (response.success) {
                    loadTasks();
                    loadStatistics();
                }
            }
        });
    });

    // Delete Task
    $(document).on('click', '.delete-task', function() {
        if (confirm('Are you sure you want to delete this task?')) {
            const taskId = $(this).data('id');
            $.ajax({
                url: 'includes/todo_handler.php?action=deleteTask',
                method: 'DELETE',
                data: JSON.stringify({ id: taskId }),
                contentType: 'application/json',
                success: function(response) {
                    if (response.success) {
                        loadTasks();
                        loadStatistics();
                        loadCategories();
                    }
                }
            });
        }
    });

    // Task Detail Modal
    $(document).on('click', '.task-detail', function() {
        const taskId = $(this).data('id');
        $.get(`includes/todo_handler.php?action=getTaskDetail&id=${taskId}`, function(response) {
            if (response.success) {
                const task = response.task;
                $('#taskDetailModal .modal-body').html(`
                    <div class="task-details">
                        <h4>${task.title}</h4>
                        <div class="mb-3">
                            <span class="category-pill" style="background-color: ${task.category_color}">${task.category_name}</span>
                            <span class="badge bg-${task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'success'}">${task.priority}</span>
                        </div>
                        ${task.description ? `<p>${task.description}</p>` : ''}
                        <div class="subtasks mb-3">
                            <h5>Subtasks</h5>
                            <ul class="list-group">
                                ${task.subtasks.map(subtask => `
                                    <li class="list-group-item d-flex justify-content-between align-items-center">
                                        ${subtask.title}
                                        <div>
                                            <button class="btn btn-sm btn-outline-success toggle-subtask" data-id="${subtask.id}">
                                                <i class="fas ${subtask.completed ? 'fa-check-circle' : 'fa-circle'}"></i>
                                            </button>
                                            <button class="btn btn-sm btn-outline-danger delete-subtask" data-id="${subtask.id}">
                                                <i class="fas fa-times"></i>
                                            </button>
                                        </div>
                                    </li>
                                `).join('')}
                            </ul>
                            <form id="addSubtaskForm" class="mt-2">
                                <div class="input-group">
                                    <input type="text" class="form-control" placeholder="Add subtask">
                                    <button class="btn btn-outline-primary" type="submit">Add</button>
                                </div>
                            </form>
                        </div>
                        <div class="time-tracking mb-3">
                            <h5>Time Tracking</h5>
                            <button class="btn btn-outline-primary" id="toggleTimer" data-task-id="${task.id}">
                                <i class="fas fa-play"></i> Start Timer
                            </button>
                            <span id="timeSpent">${formatDuration(task.time_spent)}</span>
                        </div>
                        <div class="comments">
                            <h5>Comments</h5>
                            <div class="comment-list">
                                ${task.comments.map(comment => `
                                    <div class="card mb-2">
                                        <div class="card-body">
                                            <p class="mb-1">${comment.comment}</p>
                                            <small class="text-muted">${formatDate(comment.created_at)}</small>
                                        </div>
                                    </div>
                                `).join('')}
                            </div>
                            <form id="addCommentForm" class="mt-3">
                                <div class="form-group">
                                    <textarea class="form-control" rows="2" placeholder="Add a comment"></textarea>
                                </div>
                                <button type="submit" class="btn btn-primary mt-2">Add Comment</button>
                            </form>
                        </div>
                    </div>
                `);
                $('#taskDetailModal').modal('show');
            }
        });
    });

    // Export Functions
    $('#exportCSV').on('click', function() {
        window.location.href = 'includes/todo_handler.php?action=exportCSV';
    });

    $('#exportPDF').on('click', function() {
        const element = document.getElementById('taskList');
        html2pdf().from(element).save('tasks.pdf');
    });

    $('#printTasks').on('click', function() {
        window.print();
    });

    // Filter Tasks
    function applyFilters() {
        const filters = {
            priority: $('#priorityFilter').val(),
            status: $('#statusFilter').val(),
            date_range: $('#dateRange').val(),
            search: $('#searchTask').val()
        };
        loadTasks(filters);
    }

    $('#priorityFilter, #statusFilter').on('change', applyFilters);
    $('#dateRange').on('change', applyFilters);
    $('#searchTask').on('input', debounce(applyFilters, 300));

    // Helper Functions
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
        return new Date(dateString).toLocaleDateString(undefined, options);
    }

    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        return `${hours}h ${minutes}m`;
    }

    function debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    // Alert handling function
    function showAlert(message, type = 'success') {
        const alertPlaceholder = document.querySelector('.alert-placeholder');
        if (!alertPlaceholder) {
            console.error('Alert placeholder not found');
            return;
        }

        const wrapper = document.createElement('div');
        wrapper.innerHTML = `
            <div class="alert alert-${type} alert-dismissible fade show" role="alert">
                ${message}
                <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
            </div>
        `;
        alertPlaceholder.append(wrapper);

        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            const alert = wrapper.querySelector('.alert');
            if (alert) {
                const bsAlert = new bootstrap.Alert(alert);
                bsAlert.close();
            }
        }, 5000);
    }

    // Initial Load
    loadCategories();
    loadTasks();
    loadStatistics();
}); 
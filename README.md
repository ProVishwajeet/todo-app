# Modern Todo Application

A feature-rich, responsive todo application built with PHP, MySQL, and modern JavaScript. This application helps you manage tasks efficiently with categories, priorities, and comprehensive task management features.

## 🚀 Features

### Task Management
- Create, read, update, and delete tasks
- Set task priorities (High, Medium, Low)
- Assign due dates with datetime picker
- Mark tasks as complete/incomplete
- Add detailed descriptions to tasks
- Organize tasks with color-coded categories

### Category Management
- Create custom categories with color coding
- View tasks by category
- Track task count per category
- Color-coded category pills for easy visualization

### Task Details & Tracking
- Detailed task view with modal
- Add subtasks to break down complex tasks
- Comment system for task discussions
- Time tracking functionality
- Task progress monitoring

### User Interface
- Responsive design for all devices
- Dark/Light theme toggle
- List/Grid view toggle
- Modern and clean interface
- Bootstrap-based UI components
- Real-time alerts and notifications

### Filtering & Search
- Filter tasks by priority
- Filter by completion status
- Date range filtering
- Search tasks by title
- Combined filters support

### Data Export
- Export tasks to CSV
- Export to PDF
- Print task list

### Statistics
- Task completion statistics
- Priority distribution chart
- Category-wise task distribution
- Visual data representation

## 📋 Requirements

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Web server (Apache/Nginx)
- MAMP/XAMPP/WAMP for local development
- Modern web browser

## 🛠️ Installation

### Option 1: Docker Installation (Recommended)

1. **Prerequisites**
   - Docker
   - Docker Compose

2. **Quick Start**
   ```bash
   # Clone the repository
   git clone <repository-url>
   cd todo-app

   # Start the application
   docker-compose up -d

   # The application will be available at:
   # - Todo App: http://localhost:8080
   # - phpMyAdmin: http://localhost:8081
   ```

3. **Docker Environment**
   - Application runs on port 8080
   - MySQL database runs on port 3306
   - phpMyAdmin runs on port 8081
   - Default database credentials:
     ```
     Database: todo_db
     User: todo_user
     Password: todo_password
     Root Password: root_password
     ```

4. **Docker Commands**
   ```bash
   # Start containers
   docker-compose up -d

   # Stop containers
   docker-compose down

   # View logs
   docker-compose logs -f

   # Rebuild containers
   docker-compose up -d --build

   # Remove volumes (will delete database data)
   docker-compose down -v
   ```

### Option 2: Manual Installation

1. **Database Setup**
   ```bash
   # Visit the setup URL to create database and tables
   http://localhost/todo-app/setup_database.php
   ```

2. **Database Configuration**
   - Default configuration (in `includes/config.php`):
     ```php
     DB_HOST: localhost
     DB_NAME: todo_db
     DB_USER: todo_user
     DB_PASS: todo_password
     ```
   - Modify these values if needed for your environment

3. **Web Server Configuration**
   - Place the application in your web server's document root
   - Ensure proper permissions for file operations
   - Configure URL rewriting if needed

## 🎯 Usage

### Task Management
1. **Adding Tasks**
   - Click the "Add Task" button
   - Fill in task details:
     - Title (required)
     - Category (optional)
     - Priority (default: Medium)
     - Due Date (optional)
   - Click "Save" to create the task

2. **Managing Categories**
   - Click "Add Category" in the sidebar
   - Enter category name
   - Choose a color
   - Categories appear in the sidebar and task form

3. **Task Operations**
   - Click the checkmark to toggle completion
   - Use the info icon to view/edit details
   - Delete tasks with the trash icon
   - Filter tasks using the top bar filters

### Interface Controls
- **Theme Toggle**: Click the moon/sun icon
- **View Toggle**: Switch between list and grid views
- **Filters**: Use the top bar for:
  - Priority filtering
  - Status filtering
  - Date range selection
  - Search functionality

### Data Export
- CSV: Click "Export CSV" button
- PDF: Use "Export PDF" option
- Print: Click "Print" for physical copies

## 🔒 Security

- SQL injection prevention with prepared statements
- XSS protection
- Input validation
- Secure database connections
- Error logging

## 🔄 Updates

The application is regularly updated. Check the repository for:
- New features
- Bug fixes
- Security updates
- Performance improvements

## 🐛 Troubleshooting

1. **Database Connection Issues**
   - Verify database credentials
   - Check MySQL service status
   - Ensure proper permissions

2. **Display Issues**
   - Clear browser cache
   - Update to latest browser version
   - Check console for errors

3. **Feature Not Working**
   - Check browser console
   - Verify PHP error logs
   - Ensure all dependencies are loaded

## 📝 Contributing

1. Fork the repository
2. Create a feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🐳 Docker Development

### Container Structure
- **app**: PHP 8.1 with Apache
- **db**: MySQL 8.0
- **phpmyadmin**: PHP MySQL Admin Interface

### Accessing Containers
```bash
# Access PHP container
docker exec -it todo-app bash

# Access MySQL container
docker exec -it todo-db bash

# Access MySQL CLI
docker exec -it todo-db mysql -u todo_user -p
```

### Volume Management
- Application code is mounted at `/var/www/html`
- MySQL data is persisted in named volume `todo-db-data`
- Logs are available through Docker logging

### Development Workflow
1. Make changes to the code
2. Changes are immediately reflected due to volume mounting
3. If changing Dockerfile:
   ```bash
   docker-compose up -d --build
   ```
4. To reset database:
   ```bash
   docker-compose down -v
   docker-compose up -d
   ```

### Troubleshooting Docker Setup
1. **Container Issues**
   ```bash
   # Check container status
   docker-compose ps

   # Check container logs
   docker-compose logs -f [service_name]
   ```

2. **Permission Issues**
   - Ensure proper file permissions in mounted volumes
   - Default web user (www-data) should have write access

3. **Database Connection Issues**
   - Check if MySQL container is running
   - Verify database credentials in environment variables
   - Use phpMyAdmin to check database status

4. **Performance Issues**
   - Check container resource usage
   - Monitor container logs for slow queries
   - Verify volume mount performance

---

**Note**: Keep this README updated when adding new features or making significant changes to the application. 
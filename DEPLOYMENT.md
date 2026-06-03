# EXECOS Pro - Deployment Guide

## Quick Start (Local Development)

### Prerequisites
- Node.js v16+
- npm v8+
- SQLite3

### Installation

1. **Clone/Navigate to directory**
```bash
cd C:\Users\antoi\.openclaw\workspace\execos-pro
```

2. **Install dependencies**
```bash
npm install
```

3. **Initialize database**
```bash
npm run init-db
```

4. **Start the server**
```bash
npm start
```

5. **Open dashboard**
- Server: http://localhost:3000
- Frontend: Open `frontend/index.html` in browser or serve via live server

### Development Mode (with auto-reload)
```bash
npm run dev
```

## Project Structure

```
execos-pro/
├── server.js                    # Express server
├── db.js                        # SQLite connection
├── schema.sql                   # Database schema
├── package.json                 # Dependencies
├── init-db.js                   # Database initialization
│
├── routes/
│   ├── tasks.js                # Task management endpoints
│   ├── accountability.js        # Daily/weekly check-in endpoints
│   └── ai-accountability.js     # AI feedback endpoints
│
├── utils/
│   ├── task-utils.js           # Task validation & enforcement
│   └── date-utils.js           # Date utility functions
│
├── frontend/
│   ├── index.html              # Main HTML
│   ├── app.js                  # JavaScript app
│   └── styles.css              # Dashboard styling
│
├── README.md                    # Full documentation
└── DEPLOYMENT.md               # This file
```

## Database

### Schema Location
- File: `schema.sql`
- Database: `execos-pro.db` (SQLite, auto-created)

### Tables
1. **users** — System users
2. **tasks** — Core task management
3. **task_time_logs** — Time tracking
4. **accountability_reports** — Weekly reports
5. **daily_checkins** — Morning/evening check-ins
6. **priority_enforcement** — Priority limits
7. **blocker_tracking** — Blocker escalation
8. **trend_analysis** — Performance trends
9. **enforcement_violations** — Rule violations

### Backup Database
```bash
# Backup current database
cp execos-pro.db execos-pro.db.backup

# Restore from backup
cp execos-pro.db.backup execos-pro.db
```

### Reset Database
```bash
# Delete database (will be recreated on next run)
rm execos-pro.db

# Re-run initialization
npm run init-db
```

## API Testing

### Using cURL

**Create Task**
```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "twiney-001",
    "title": "Test Task",
    "due_date": "2026-06-15",
    "priority": "high",
    "estimated_hours": 2,
    "success_criteria": "Task completed successfully"
  }'
```

**List Tasks**
```bash
curl http://localhost:3000/api/tasks?user_id=twiney-001
```

**Get Task Detail**
```bash
curl http://localhost:3000/api/tasks/{task_id}
```

**Mark Task Complete**
```bash
curl -X POST http://localhost:3000/api/tasks/{task_id}/complete \
  -H "Content-Type: application/json" \
  -d '{"completion_notes": "Task finished. All requirements met."}'
```

**Log Time**
```bash
curl -X POST http://localhost:3000/api/tasks/{task_id}/time-log \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "twiney-001",
    "hours_spent": 2.5,
    "notes": "Completed analysis and documentation"
  }'
```

**Morning Check-In**
```bash
curl -X POST http://localhost:3000/api/accountability/daily-checkin/morning \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "twiney-001",
    "tasks_listed": ["task-1", "task-2"]
  }'
```

**Evening Check-Out**
```bash
curl -X POST http://localhost:3000/api/accountability/daily-checkin/evening \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "twiney-001",
    "tasks_completed": ["task-1"]
  }'
```

**Weekly Report**
```bash
curl -X POST http://localhost:3000/api/accountability/weekly-report \
  -H "Content-Type: application/json" \
  -d '{"user_id": "twiney-001"}'
```

### Using Postman

1. Import the API endpoints into Postman
2. Set base URL: `http://localhost:3000/api`
3. Use the cURL examples above in Postman format

## Customization

### Change Default User ID
Edit `init-db.js`:
```javascript
const userId = 'your-user-id';
```

### Change Server Port
Set environment variable or edit `server.js`:
```javascript
const PORT = process.env.PORT || 3000;
```

### Modify Database Path
Edit `db.js`:
```javascript
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'execos-pro.db');
```

### Adjust Enforcement Rules
Edit `utils/task-utils.js`:
```javascript
const MAX_IN_PROGRESS = 5; // Modify as needed
```

## Logging & Debugging

### Enable Verbose Logging
Add to `server.js`:
```javascript
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`, req.body);
  next();
});
```

### Check Database Integrity
```javascript
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database('./execos-pro.db');

db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, rows) => {
  console.log('Tables:', rows);
});
```

### View Raw Tasks
```bash
sqlite3 execos-pro.db "SELECT id, title, status, priority FROM tasks;"
```

## Production Deployment

### Prerequisites
- Node.js server
- Database backup strategy
- Process manager (PM2)
- Reverse proxy (nginx)

### Using PM2
```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start server.js --name "execos-pro"

# Save PM2 config
pm2 save

# Enable startup on reboot
pm2 startup
```

### nginx Configuration
```nginx
server {
    listen 80;
    server_name execos.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

### Environment Variables (Production)
```bash
# .env
NODE_ENV=production
PORT=3000
DATABASE_PATH=/var/lib/execos/execos-pro.db
USER_ID=twiney-001
TIMEZONE=America/New_York
```

### Database Location (Production)
- Store database in persistent location: `/var/lib/execos/execos-pro.db`
- Implement daily backups
- Consider PostgreSQL for larger scale

### SSL/HTTPS
```bash
# Generate SSL certificate
certbot certonly --standalone -d execos.yourdomain.com

# Update nginx config with SSL
```

## Monitoring

### Health Check
```bash
curl http://localhost:3000/health
```

### Response: 
```json
{"status": "OK", "timestamp": "2026-06-02T23:03:00.000Z"}
```

### Monitor Task Health
```bash
curl http://localhost:3000/api/tasks/user/twiney-001/overdue
```

### Monitor Blockers
```bash
curl http://localhost:3000/api/tasks/user/twiney-001/blockers
```

## Troubleshooting

### Port Already in Use
```bash
# Find process using port 3000
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Locked
- Close all database connections
- Delete `execos-pro.db-wal` and `execos-pro.db-shm`
- Restart server

### Module Not Found
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### Cannot Initialize Database
- Check write permissions in directory
- Ensure SQLite3 is installed
- Check schema.sql for syntax errors

## Backup & Recovery

### Daily Backup Script
```bash
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
cp /var/lib/execos/execos-pro.db /var/lib/execos/backups/execos-pro_$DATE.db
```

### Restore from Backup
```bash
cp /var/lib/execos/backups/execos-pro_20260602_230300.db /var/lib/execos/execos-pro.db
```

## Support

### Check Logs
```bash
# Server logs
tail -f server.log

# Error logs
tail -f error.log
```

### Debug Mode
```bash
# Start with debug logging
DEBUG=* npm start
```

### Common Issues

**Tasks not showing:**
- Clear localStorage: `localStorage.clear()`
- Check user_id matches
- Verify tasks created in database

**Cannot create task:**
- Check all required fields filled
- Verify due_date is in future
- Check priority is valid

**Time log not working:**
- Ensure task exists
- Verify task_id format
- Check user_id matches

---

**Version:** 1.0.0  
**Last Updated:** June 2, 2026  
**Status:** Ready for Deployment

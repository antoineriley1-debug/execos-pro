# EXECOS Pro - System Architecture

## High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    EXECOS Pro System                         │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────────┐         ┌──────────────────┐          │
│  │  Frontend        │         │  Backend         │          │
│  │  (Browser)       │◄───────►│  (Node.js)       │          │
│  │                  │  HTTP   │                  │          │
│  │  - Dashboard     │  REST   │  - Express       │          │
│  │  - Task UI       │  JSON   │  - Route Handlers│          │
│  │  - Reports       │         │  - Validation    │          │
│  │  - Check-ins     │         │  - Business Logic│          │
│  └──────────────────┘         └────────┬─────────┘          │
│                                         │                    │
│                                    SQLite3                   │
│                                    Database                  │
│                                         │                    │
│                              ┌──────────▼─────────┐          │
│                              │  execos-pro.db     │          │
│                              │                    │          │
│                              │  - Tasks           │          │
│                              │  - Time Logs       │          │
│                              │  - Reports         │          │
│                              │  - Check-ins       │          │
│                              │  - Violations      │          │
│                              └────────────────────┘          │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## Component Architecture

### 1. Frontend Layer

**Technology:** Vanilla JavaScript + HTML/CSS

**Components:**
```
app.js (Main Application)
├── Dashboard View
│   ├── Metric Cards (overdue, blocked, today, completion %)
│   ├── Overdue Section (RED alerts)
│   ├── Blocked Section (YELLOW warnings)
│   ├── Today Section
│   └── In-Progress Section
│
├── Tasks View
│   ├── Task List (filtered/sortable)
│   ├── Task Items (with priority coloring)
│   └── Status Indicators
│
├── Create Task Modal
│   ├── Form Validation (client-side)
│   ├── Required Field Enforcement
│   └── Submission to API
│
├── Time Logging
│   ├── Task Selection
│   ├── Hours Input
│   └── Notes Field
│
├── Accountability View
│   ├── Morning Check-in Button
│   ├── Evening Check-out Button
│   ├── Weekly Report Button
│   └── Trend Analysis Button
```

**Styling:** `styles.css`
- Dark theme (accountability mode)
- Color coding: Red (critical), Yellow (warning), Green (success)
- Responsive design
- No gentle UI elements

### 2. Backend API Layer

**Framework:** Express.js

**Entry Point:** `server.js`
```javascript
// Server setup
- CORS enabled
- Body parser middleware
- Route registration
- Error handling
- Database initialization
```

**Routes:**

#### `/api/tasks` — Task Management
```
POST   /api/tasks
       Create new task
       Input: title, due_date, priority, estimated_hours, success_criteria
       Validation: validateTaskCreation()
       Returns: task_id or error

GET    /api/tasks?user_id=X&status=Y&priority=Z
       List tasks with filters
       Sorting: priority DESC, due_date ASC
       Returns: tasks array with metrics

GET    /api/tasks/:id
       Get task details
       Includes: dependencies, time logs, overdue status
       Returns: full task object

PUT    /api/tasks/:id
       Update task (status, priority, blocker, etc.)
       Validation: enforceBlockerRules()
       Returns: success or validation error

POST   /api/tasks/:id/complete
       Mark task complete (REQUIRES NOTES)
       Validation: completion_notes required
       Returns: completion percentage

POST   /api/tasks/:id/time-log
       Log hours spent on task
       Input: hours_spent, notes
       Updates: actual_hours, time_logged array
       Returns: variance analysis

GET    /api/tasks/user/:user_id/overdue
       Get all overdue tasks
       Sorting: due_date ASC (most overdue first)
       Returns: overdue count, severity, tasks array

GET    /api/tasks/user/:user_id/blockers
       Get all blocked tasks
       Includes: days_blocked, escalation_needed
       Returns: blocked count, escalation flags
```

#### `/api/accountability` — Daily/Weekly Check-ins
```
POST   /api/accountability/daily-checkin/morning
       Morning accountability check-in
       Input: tasks_listed array
       Action: Cross-references system, flags inconsistencies
       Returns: AI response with feedback

POST   /api/accountability/daily-checkin/evening
       Evening check-out and completion report
       Input: tasks_completed array
       Action: Compares to planned, analyzes time
       Returns: hard feedback on completion

POST   /api/accountability/weekly-report
       Generate weekly accountability report
       Action: Aggregates week's data, calculates metrics
       Returns: full report with AI feedback
```

#### `/api/ai` — AI Accountability Assistant
```
POST   /api/ai/accountability-check
       AI check-in (morning/evening/blocker/priority)
       Types:
         - morning: Daily task review
         - evening: Completion tracking
         - blocker: Blocked task analysis
         - priority: Priority enforcement check
       Returns: AI assessment with hard feedback

POST   /api/ai/performance-report
       Performance analysis
       Period: week or month
       Returns: trends, insights, recommendations

GET    /api/ai/trends/:user_id
       Long-term trend analysis
       Analysis: 12-week or monthly patterns
       Returns: completion trend, time variance trend, patterns
```

### 3. Business Logic Layer

**File:** `utils/task-utils.js`

```javascript
validateTaskCreation(data)
  ├─ Check title required
  ├─ Check due_date required (future only)
  ├─ Check priority required
  ├─ Check estimated_hours required
  ├─ Check success_criteria required
  └─ Return: valid or error

validateCriticalLimit(tasks)
  ├─ Max 1 critical task
  ├─ Return: valid or error

validateInProgressLimit(tasks)
  ├─ Max 5 in-progress tasks
  ├─ Return: valid or error

canStartNewTask(inProgress, overdue, critical)
  ├─ Check no overdue tasks
  ├─ Check in-progress < 5
  ├─ Check no incomplete critical
  └─ Return: allowed or issues array

analyzeTimeVariance(task)
  ├─ Calculate variance %
  ├─ Flag if > 30% off
  ├─ Return: variance, assessment

hasEstimateLiePattern(tasks)
  ├─ Analyze last 5 completed tasks
  ├─ Check if consistently underestimating
  └─ Return: pattern detected or false

isOverdue(dueDate)
  └─ Check if past due

calculateCompletionPercentage(task)
  └─ Estimate actual/estimated hours
```

**File:** `utils/date-utils.js`

```javascript
getWeekRange(date)
  └─ Return: {weekStart, weekEnd}

getMonthRange(date)
  └─ Return: {monthStart, monthEnd}

getDaysUntilDue(dueDate)
  └─ Return: days remaining

isToday(dateString)
  └─ Return: boolean

isOverdue(dateString)
  └─ Return: boolean
```

### 4. Database Layer

**Technology:** SQLite3

**File:** `db.js`

```javascript
initialize()
  ├─ Open database connection
  ├─ Enable foreign keys
  ├─ Load schema.sql
  └─ Return: promise

run(query, params)
  ├─ Execute INSERT/UPDATE/DELETE
  └─ Return: lastID, changes

get(query, params)
  ├─ Execute SELECT (single row)
  └─ Return: row object

all(query, params)
  ├─ Execute SELECT (all rows)
  └─ Return: rows array

close()
  └─ Close connection
```

### 5. Database Schema

**File:** `schema.sql`

**Core Tables:**

```
users
├─ id (PK)
├─ name
├─ email (UNIQUE)
├─ timezone
└─ created_at, updated_at

tasks (MAIN)
├─ id (PK)
├─ user_id (FK users)
├─ title
├─ description
├─ due_date (NOT NULL)
├─ priority (CHECK: low/medium/high/critical)
├─ owner_id (FK users)
├─ status (CHECK: not_started/in_progress/blocked/complete/cancelled)
├─ estimated_hours
├─ actual_hours
├─ time_logged (JSON array)
├─ success_criteria
├─ completion_notes
├─ blocked_reason
├─ unblock_date
├─ dependencies (JSON array)
├─ related_email_id
├─ related_project_id
├─ related_contract_id
├─ created_at
├─ started_at
├─ completed_at
├─ archived
├─ archived_reason
└─ updated_at
INDEXES:
  - idx_tasks_user_status
  - idx_tasks_user_due
  - idx_tasks_user_priority
  - idx_tasks_overdue
  - idx_tasks_blocked

task_time_logs
├─ id (PK)
├─ task_id (FK tasks)
├─ user_id (FK users)
├─ hours_spent
├─ date_logged
├─ notes
└─ created_at
INDEXES:
  - idx_time_logs_task
  - idx_time_logs_user_date

accountability_reports
├─ id (PK)
├─ user_id (FK users)
├─ report_date
├─ week_start_date
├─ week_end_date
├─ tasks_planned
├─ tasks_completed
├─ tasks_overdue
├─ total_hours_estimated
├─ total_hours_actual
├─ time_variance_percent
├─ completion_rate
├─ blockers_count
├─ blockers_list (JSON)
├─ ai_feedback
├─ notes
└─ created_at
INDEXES:
  - idx_reports_user_date
  - UNIQUE(user_id, week_start_date)

daily_checkins
├─ id (PK)
├─ user_id (FK users)
├─ checkin_date
├─ checkin_type (morning/evening)
├─ tasks_listed (JSON)
├─ tasks_reported (JSON)
├─ ai_response
└─ created_at
INDEXES:
  - idx_checkins_user_date

[Additional tables...]
```

## Data Flow Diagrams

### Task Creation Flow
```
User Input (Form)
      ↓
Frontend Validation (client-side)
      ↓
POST /api/tasks
      ↓
validateTaskCreation() (server-side)
      ├─ Check all required fields
      ├─ Validate due_date future
      ├─ Check priority valid
      └─ Check estimate > 0
      ↓ (Error) → Return 400 with violation
      ↓ (Valid)
Generate UUID
      ↓
INSERT into tasks table
      ↓
Return task_id (201)
      ↓
Frontend: Update task list
```

### Task Completion Flow
```
User clicks "Mark Complete"
      ↓
Prompt: "What did you accomplish?"
      ↓
User enters completion_notes
      ↓
POST /api/tasks/{id}/complete
      ↓
Validation:
├─ Check completion_notes not empty
├─ Check task not blocked
└─ Check task exists
      ↓ (Error) → Return 400 with error
      ↓ (Valid)
UPDATE tasks SET status='complete', completed_at=now
      ↓
Return 200 with completion_percentage
      ↓
Frontend: Remove from today's section, mark as complete
```

### Morning Check-In Flow
```
8 AM Trigger
      ↓
Display: "What are your tasks for today?"
      ↓
User lists tasks
      ↓
POST /api/accountability/daily-checkin/morning
      ↓
Fetch today's tasks from system
      ↓
Compare listed vs system
      ↓ (Match) → "✓ Tasks aligned"
      ↓ (Mismatch) → "⚠️ Discrepancy found"
      ↓
Save check-in record
      ↓
Return feedback to user
```

### Weekly Report Flow
```
Friday 5 PM Trigger
      ↓
GET tasks for this week
      ↓
Aggregate metrics:
├─ tasks_planned
├─ tasks_completed
├─ tasks_overdue
├─ total_hours_estimated
├─ total_hours_actual
└─ Calculate percentages
      ↓
Generate AI feedback
├─ Analyze completion rate
├─ Analyze time variance
├─ Identify patterns
└─ Provide hard feedback
      ↓
INSERT accountability_report
      ↓
Return full report
      ↓
Frontend: Display with AI commentary
```

## Enforcement Mechanisms

### At API Level
```
POST /api/tasks
  ├─ validateTaskCreation() → All fields required
  └─ Return 400 if violations

PUT /api/tasks/{id}
  ├─ If status='blocked'
  │  └─ Require unblock_date
  └─ Reject if missing

POST /api/tasks/{id}/complete
  ├─ Require completion_notes (not empty)
  ├─ Check task not blocked
  └─ Reject if violations

GET /api/tasks?user_id=X
  ├─ Flag overdue tasks
  ├─ Flag blocked tasks
  ├─ Calculate metrics
  └─ Return alert-ready data
```

### At UI Level
```
Dashboard
├─ Overdue section: RED, top, always visible
├─ Blocked section: YELLOW, high priority
├─ No snooze button: Forces decision
└─ Metrics: Immediate visibility

Task Detail
├─ Cannot mark complete without notes input
├─ Cannot change if blocked (must unblock first)
└─ Success criteria as checklist
```

### Scheduled Checks
```
8 AM: Morning check-in reminder
5 PM: Evening check-out reminder
Daily: Overdue task alerts
Friday: Mandatory weekly report
Every 5 days: Blocker escalation review
Monthly: Trend analysis
```

## Error Handling

### Validation Errors (4xx)
```json
{
  "error": "Descriptive error message",
  "rule": "Which rule violated",
  "action": "What user should do"
}
```

Examples:
```
400: "ENFORCEMENT RULE #1: All tasks MUST have a deadline"
400: "Cannot mark complete without detailed notes"
400: "BLOCKED tasks MUST have an unblock_date"
400: "Task not found"
400: "You have 5 tasks in progress. Complete one first"
```

### Server Errors (5xx)
```json
{
  "error": "Internal Server Error",
  "message": "Error details"
}
```

### Database Errors
```
Connection failed → Server restart required
Foreign key violation → Data integrity check
Transaction deadlock → Retry logic
```

## Performance Considerations

### Indexing Strategy
```
Frequently queried:
- user_id + status (task list views)
- user_id + due_date (sorting)
- status='overdue' (alert queries)
- status='blocked' (escalation checks)
- user_id + date (time log analysis)
```

### Query Optimization
```
- Use LIMIT for pagination
- Index by user_id first (multi-tenant)
- Aggregate at query time vs storage
- Cache dashboard metrics (5 min TTL)
```

### Database Size Management
```
- Archive completed tasks after 90 days
- Archive cancelled tasks after 30 days
- Monthly cleanup of old check-in records
- Backup strategy: daily incremental
```

## Security Considerations

### Data Protection
```
- SQLite file permissions: 0600 (user only)
- API: No authentication required (local only)
- Database: Enable foreign keys
- Backups: Encrypted storage
```

### Validation
```
- All inputs validated server-side
- No SQL injection: Parameterized queries
- Type checking: Ensure data types
- Range validation: Times, dates, counts
```

## Deployment Architecture

### Development
```
localhost:3000 → Frontend + Backend on same machine
Database: ./execos-pro.db
```

### Production
```
┌─────────────┐
│  Browser    │
└──────┬──────┘
       │ HTTPS
       ▼
┌──────────────────────┐
│ nginx (reverse proxy)│
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ PM2 (Node.js)        │
│ - server.js running  │
└──────┬───────────────┘
       │
       ▼
┌──────────────────────┐
│ SQLite DB            │
│ /var/lib/execos/     │
│ execos-pro.db        │
└──────────────────────┘
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Vanilla JS | Simple, no dependencies |
| Backend | Node.js + Express | Lightweight, fast API |
| Database | SQLite3 | File-based, portable, ACID |
| Process Manager | PM2 | Auto-restart, monitoring |
| Reverse Proxy | nginx | SSL, load balancing |
| Hosting | VPS/Linux | Scalable, reliable |

---

**Architecture Version:** 1.0.0  
**Last Updated:** June 2, 2026  
**Design Philosophy:** Simple, Enforced, Accountable

# EXECOS Pro - Strict Accountability Task Management System

## Overview

**EXECOS Pro** is a no-nonsense, accountability-first task management system designed to hold Twiney accountable to his commitments with **zero excuses** and **hard feedback**. This is NOT a gentle reminder app. This is an accountability enforcer.

## Core Philosophy

- **No Escape Hatches** — Every rule is enforced. No snoozing, no vague completions, no indefinite blocks.
- **Hard Feedback** — Daily check-ins reveal the gap between what you said you'd do and what you actually did.
- **Strict Time Tracking** — Estimates vs actual time tracked. Patterns identified. No lying.
- **Weekly Accountability** — Friday accountability reports are mandatory. Cannot skip or dismiss.
- **Escalation Enforcement** — Tasks overdue >3 days or blocked >5 days trigger automatic escalation.

## System Architecture

### Backend (Node.js/Express)
- **Database:** SQLite3 with strict schema
- **API:** RESTful endpoints for all task operations
- **Enforcement:** Business logic validates all rules at API level

### Frontend (Vanilla JavaScript)
- **Dashboard:** Real-time task visualization with critical alerts
- **Task Management:** Create, update, complete with enforcement
- **Accountability:** Morning/evening check-ins, weekly reports, trend analysis

### Database
- **tasks** — Core task management
- **task_time_logs** — Time tracking records
- **accountability_reports** — Weekly performance metrics
- **daily_checkins** — Morning/evening tracking
- **priority_enforcement** — Priority limit tracking
- **blocker_tracking** — Escalation management
- **trend_analysis** — Historical performance patterns
- **enforcement_violations** — Rule violation tracking

## Installation

```bash
cd execos-pro
npm install
npm run init-db
npm start
```

Server runs on `http://localhost:3000`

## Key Features

### 1. Task Creation (STRICT)
- **Required Fields:**
  - Title
  - Due Date (no exceptions)
  - Priority (forced choice, max 1 critical)
  - Estimated Hours
  - Success Criteria (how do you know it's done?)
  
- **Validation:**
  - Cannot create task without deadline
  - Cannot skip priority selection
  - Cannot skip success criteria definition
  - Must estimate time in hours

### 2. Task Enforcement
- **Overdue Flagging:** Immediate RED alerts, no hiding
- **Blocker Management:** Must provide reason + unblock date (no indefinite blocks)
- **Completion Requirements:** Cannot mark complete without detailed notes
- **Status Tracking:** Active updates required

### 3. Daily Accountability
- **8 AM Morning Check-In:** "What are your tasks for today?"
  - Cross-references system tasks
  - Flags inconsistencies
  - Provides hard feedback if light workload
  
- **5 PM Evening Check-Out:** "What did you complete today?"
  - Tracks completion vs planned
  - Analyzes time spent vs estimated
  - Provides hard feedback on misses

### 4. Time Tracking
- **Mandatory:** Every task requires time tracking
- **Analysis:** Actual vs estimated, identifies patterns
- **Feedback:** "You're consistently underestimating by 40%"
- **Weekly Audit:** "Where did your time actually go?"

### 5. Priority Enforcement
- **Critical Limit:** Only 1 task can be truly critical at a time
- **In-Progress Limit:** Maximum 5 active tasks
- **Overload Prevention:** "You have 5 critical tasks but can't do them all"
- **Forced Decision:** Must prioritize or cannot proceed

### 6. Weekly Accountability Report
- **Mandatory Friday:** Cannot skip or dismiss
- **Metrics:**
  - Tasks planned vs completed
  - Time spent vs estimated
  - Blockers and their reasons
  - Completion rate with hard feedback
  - Next week forecast
  
- **Hard Feedback Examples:**
  - "You completed 60% of tasks. That's unacceptable."
  - "You're 40% off on estimates. Adjust or stop taking on so much."
  - "3 tasks blocked for 5+ days. Escalate or fix them."

### 7. Blocker Management
- **Required Documentation:**
  - What's stopping this? (specific reason)
  - When will it be resolved? (unblock date)
  - What's your plan? (escalation path)
  
- **5-Day Rule:** Blocked >5 days = automatic escalation alert
- **Weekly Review:** "Why are these still blocked?"
- **No Indefinite Blocks:** Must have clear unblock date

### 8. Trend Analysis
- **Monthly Patterns:** "Your completion rate is declining"
- **Consistency:** Week-over-week performance tracking
- **Problem Areas:** "Fridays always blocked. Why?"
- **Root Causes:** "Vendor follow-ups are your biggest time drain"

## API Endpoints

### Task Management
```
POST   /api/tasks                    - Create task (strict validation)
GET    /api/tasks                    - List tasks with filters
GET    /api/tasks/[id]               - Get task detail
PUT    /api/tasks/[id]               - Update task (validates rules)
POST   /api/tasks/[id]/complete      - Mark complete (requires note)
POST   /api/tasks/[id]/time-log      - Log time spent
GET    /api/tasks/user/[id]/overdue  - Get overdue tasks
GET    /api/tasks/user/[id]/blockers - Get blocked tasks
```

### Accountability
```
POST   /api/accountability/daily-checkin/morning   - Morning check-in
POST   /api/accountability/daily-checkin/evening   - Evening check-out
POST   /api/accountability/weekly-report            - Generate weekly report
```

### AI Accountability
```
POST   /api/ai/accountability-check   - AI check (type: morning/evening/blocker/priority)
POST   /api/ai/performance-report     - Performance analysis (period: week/month)
GET    /api/ai/trends/[user_id]       - Trend analysis
```

## Enforcement Rules (No Exceptions)

### Rule #1: No Task Without Deadline
- **Enforcement:** API validation rejects task creation
- **Error:** "ENFORCEMENT RULE #1: All tasks MUST have a deadline"

### Rule #2: No Snooze Button
- **Enforcement:** Cannot push overdue tasks back
- **Options:** Complete, block (with reason), or cancel (with reason)

### Rule #3: No Vague Completion
- **Enforcement:** Cannot mark complete without detailed notes
- **Error:** "CANNOT mark complete without detailed notes. What exactly did you accomplish?"

### Rule #4: No Indefinite Blocks
- **Enforcement:** Blocked tasks MUST have unblock_date
- **5-Day Alert:** "This has been blocked 5 days. Escalation required."

### Rule #5: No Task Dumping
- **Max Active:** 5 in-progress tasks maximum
- **Enforcement:** Cannot create new task if critical task is overdue
- **Message:** "You have 3 overdue tasks. Complete them before starting new work."

### Rule #6: No Estimate Lies
- **Monitoring:** Consistent underestimation tracked
- **Intervention:** "You're off by 40%. Adjust estimates or stop taking on so much."
- **Mandatory:** Time tracking required for all tasks

### Rule #7: Must Complete Weekly Report
- **Friday Mandatory:** Cannot skip or dismiss
- **Enforcement:** Must answer "What did you complete? What didn't you?"
- **Hard Feedback:** "60% completion is unacceptable. What blocked you?"

### Rule #8: Escalation Rule
- **Blocker >5 days:** Automatic escalation prompt
- **Task overdue >3 days:** Must escalate or complete
- **Critical task overdue:** Immediate alert

## Dashboard Features

### Real-Time Alerts
- **Overdue Section:** RED, prominent, cannot miss
- **Blocked Section:** Yellow, shows reason + unblock date
- **Today's Section:** Tasks due today in priority order
- **In Progress:** Current active work with time spent

### Metrics
- Overdue count (CRITICAL)
- Blocked count (WARNING)
- Due today count
- Overall completion rate

### Enforcement Indicators
- Task variance (actual vs estimated)
- Priority conflicts (too many critical)
- Time overruns (estimated vs actual)
- Blocker escalations

## Usage Examples

### Creating a Task
```javascript
POST /api/tasks
{
  "user_id": "twiney-001",
  "title": "Vendor Contract Review",
  "description": "Review and approve new vendor agreement",
  "due_date": "2026-06-15",
  "priority": "high",
  "estimated_hours": 3,
  "success_criteria": "Contract reviewed, feedback provided, approved or rejected",
  "owner_id": "twiney-001"
}
// Response: Task created. No snoozing. Complete it or block it with a reason.
```

### Marking Complete
```javascript
POST /api/tasks/{id}/complete
{
  "completion_notes": "Reviewed contract, identified 3 concerns, sent feedback to vendor. Awaiting response. Task 80% complete, dependency on vendor."
}
// Requires: Detailed notes explaining what was done
// Cannot: Complete if task is blocked
```

### Logging Time
```javascript
POST /api/tasks/{id}/time-log
{
  "user_id": "twiney-001",
  "hours_spent": 2.5,
  "notes": "Contract analysis, legal review, drafting feedback"
}
// Tracked and analyzed against estimate
```

### Morning Check-In
```javascript
POST /api/accountability/daily-checkin/morning
{
  "user_id": "twiney-001",
  "tasks_listed": ["task-1", "task-2", "task-3"]
}
// Response: Cross-references against system, flags discrepancies
```

### Evening Check-Out
```javascript
POST /api/accountability/daily-checkin/evening
{
  "user_id": "twiney-001",
  "tasks_completed": ["task-1"]
}
// Response: Hard feedback on completion vs planned
// "You said you'd finish 3. You finished 1. Why?"
```

### Weekly Report
```javascript
POST /api/accountability/weekly-report
{
  "user_id": "twiney-001"
}
// Response: Completion rate, time analysis, blocker review, AI feedback
```

## Dashboard Walkthrough

### Opening EXECOS Pro
1. See immediate alerts for overdue and blocked tasks
2. View today's tasks prominently
3. Check completion metrics at a glance
4. Use tabs to navigate views

### Morning Routine
1. Click "Accountability" tab
2. Click "Start Check-In"
3. List tasks for the day
4. System cross-references and provides feedback

### Task Creation
1. Click "Create Task" tab
2. Fill all required fields
3. Define clear success criteria
4. System validates deadline + priority
5. Task created in system

### Tracking Progress
1. Click "Time Log" tab
2. Select in-progress task
3. Log hours spent with notes
4. System tracks against estimate

### Evening Review
1. Click "Accountability" tab
2. Click "End of Day Report"
3. Report what you completed
4. Receive hard feedback
5. Unfinished tasks roll to next day

### Weekly Assessment
1. Every Friday: "End of Week Report" auto-triggered
2. Mandatory: Cannot skip or dismiss
3. Feedback: Honest assessment of performance
4. Trends: Compare to previous weeks

## Monitoring & Alerts

### Immediate Alerts (Real-Time)
- Task marked overdue
- Blocker added without unblock date
- Critical task created (when already exists)
- Task marked complete without notes

### Daily Alerts (8 AM & 5 PM)
- Morning check-in reminder
- Evening check-out reminder
- Overdue task warnings (daily)

### Weekly Alerts (Friday)
- Accountability report due
- Blocker escalation review
- Time analysis feedback
- Trend comparison

### Escalation Alerts
- Task overdue 3+ days
- Task blocked 5+ days
- Critical task behind schedule
- Multiple high-priority tasks overdue

## Configuration

### Environment Variables
```
PORT=3000
DATABASE_PATH=./execos-pro.db
USER_ID=twiney-001
TIMEZONE=America/New_York
```

### Customization
- Modify enforcement rules in `utils/task-utils.js`
- Adjust time limits in `routes/accountability.js`
- Customize feedback messages in `routes/ai-accountability.js`

## Troubleshooting

### Task Won't Create
- Check required fields (title, due date, priority, estimated hours, success criteria)
- Ensure due date is in future
- Verify priority is valid

### Cannot Mark Complete
- Ensure task is not blocked
- Provide detailed completion notes
- Check task status

### Overdue Alerts Not Showing
- Check task due date
- Verify task status is not 'complete'
- Check timezone settings

## Future Enhancements

- Integration with email for action item extraction
- Slack notifications for alerts
- Calendar sync for deadline visibility
- Mobile app for quick check-ins
- AI-powered blocker suggestions
- Integration with billing systems for project tracking

## Support

For issues or questions:
1. Check the enforcement rules
2. Verify API endpoint usage
3. Check database schema alignment
4. Review error responses for specific violations

---

**Built for:** Twiney (EXECOS)  
**Mode:** STRICT - No Excuses, No Snoozing, No Vague Completions  
**Philosophy:** Accountability through radical transparency and hard feedback

# EXECOS Pro - Enforcement Rules (No Exceptions)

This document defines the **non-negotiable rules** of the EXECOS Pro accountability system. These are not suggestions or guidelines. These are hard-coded enforcement mechanisms.

## Rule #1: No Task Without Deadline

**Status:** ENFORCED AT API LEVEL

### The Rule
Every task MUST have a due date. No exceptions. No "someday" tasks. No open-ended commitments.

### Enforcement
- **Validation:** POST /api/tasks rejects task if `due_date` is missing
- **Error Response:**
  ```json
  {
    "error": "ENFORCEMENT RULE #1: All tasks MUST have a deadline. No exceptions.",
    "rule": "No Task Without Deadline"
  }
  ```
- **Code Location:** `routes/tasks.js` — `validateTaskCreation()`

### Why
Without deadlines, tasks become infinite. They stay on your list forever. Deadlines force prioritization and create urgency.

### How to Comply
When creating a task, specify an exact due date (future only):
```javascript
{
  "due_date": "2026-06-15"
}
```

---

## Rule #2: No Snooze Button

**Status:** ENFORCED BY DESIGN

### The Rule
Overdue tasks cannot be pushed back. You must either:
1. **Complete it** — Mark as complete with notes
2. **Block it** — With reason + unblock date
3. **Cancel it** — With documented reason

### Enforcement
- **UI:** No "Snooze" or "Push Back" button exists
- **API:** PUT endpoint prevents status changes to rescheduled without explanation
- **Alert:** Overdue tasks flagged RED and visible every morning

### Why
Snoozing is procrastination. It hides problems. EXECOS Pro makes problems visible until resolved.

### How to Comply
If task is overdue:
```javascript
// Option 1: Complete it
POST /api/tasks/{id}/complete
{
  "completion_notes": "Task completed. Here's what was done..."
}

// Option 2: Block it
PUT /api/tasks/{id}
{
  "status": "blocked",
  "blocked_reason": "Waiting for vendor response",
  "unblock_date": "2026-06-10"
}

// Option 3: Cancel it
PUT /api/tasks/{id}
{
  "status": "cancelled",
  "archived_reason": "No longer needed. Vendor changed requirements."
}
```

---

## Rule #3: No Vague Completion

**Status:** ENFORCED AT COMPLETION

### The Rule
You cannot mark a task complete without detailed completion notes explaining what was done, what was accomplished, and what the result is.

### Enforcement
- **API Validation:** POST /api/tasks/{id}/complete requires `completion_notes`
- **Minimum Length:** Notes cannot be empty or trivial
- **Error Response:**
  ```json
  {
    "error": "CANNOT mark complete without detailed notes.",
    "required": "What exactly did you accomplish? What was the result?",
    "rule": "Enforcement Rule #3: No Vague Completion"
  }
  ```

### Why
Vague completions hide incomplete work. Detailed notes create accountability and a record of what was done.

### What Counts (Examples)

✅ **Good:**
```
"Reviewed 15-page vendor contract, identified 3 major concerns (payment terms, liability clause, termination provision), drafted detailed feedback email to vendor, sent for review. Awaiting vendor response on modifications."
```

✅ **Good:**
```
"Created supply/demand zones for TSLA: identified 2 resistance zones ($242-$245, $248-$251), 1 support zone ($235-$238), calculated measured potential to $255 (good risk/reward), added to trading plan."
```

❌ **Bad:**
```
"Done"
```

❌ **Bad:**
```
"Finished contract review"
```

❌ **Bad:**
```
"Completed as planned"
```

---

## Rule #4: No Indefinite Blocks

**Status:** ENFORCED AT BLOCK CREATION

### The Rule
If a task is blocked, it MUST have:
1. **Specific blocker reason** — What exactly is stopping this?
2. **Unblock date** — When will this be resolved?
3. **Action plan** — What's being done to unblock it?

### Enforcement
- **API Validation:** PUT endpoint rejects block without `unblock_date`
- **5-Day Alert:** If blocked >5 days, automatic escalation prompt
- **Error Response:**
  ```json
  {
    "error": "BLOCKED tasks MUST have an unblock_date. No indefinite blocks allowed.",
    "rule": "Enforcement Rule #4: No Indefinite Blocks"
  }
  ```

### Why
Indefinite blocks hide problems. They become invisible. EXECOS tracks blockers and forces resolution.

### How to Comply
When blocking a task:
```javascript
PUT /api/tasks/{id}
{
  "status": "blocked",
  "blocked_reason": "Waiting for legal review on contract terms",
  "unblock_date": "2026-06-10"
}
```

### Follow-Up Requirement
If not unblocked by `unblock_date`, you'll receive:
```
🔴 BLOCKER ESCALATION: "Contract review" has been blocked 5 days.
Why is it still blocked?
What's your plan to unblock it?
Who do you need to escalate to?
```

---

## Rule #5: No Task Dumping

**Status:** ENFORCED AT CREATION & UPDATE

### The Rule
You cannot create unlimited tasks and ignore half of them. Constraints apply:

1. **Maximum 5 in-progress tasks** — No task starting if already 5 active
2. **No new tasks if overdue exists** — Complete overdue tasks first
3. **No new task if critical task behind** — Critical tasks get priority

### Enforcement
- **API Validation:** POST/PUT rejects new in-progress task if limits exceeded
- **Error Response:**
  ```json
  {
    "error": "TASK DUMPING PREVENTION: You have 5 tasks in progress. No more until you complete some.",
    "rule": "No Task Dumping"
  }
  ```

### Why
Task dumping creates false sense of productivity. 5 incomplete tasks beats 20 half-started ones.

### How to Comply
Before creating new task, complete or block existing ones:
```bash
# Check current load
GET /api/tasks?user_id=twiney-001&status=in_progress

# Complete or block before adding new
POST /api/tasks/{old_id}/complete
PUT /api/tasks/{old_id} (status: blocked)

# Now create new task
POST /api/tasks (new)
```

---

## Rule #6: No Estimate Lies

**Status:** ENFORCED BY TRACKING

### The Rule
You must estimate time for every task. The system tracks actual vs estimated. If you consistently underestimate, the AI will call you out.

### Enforcement
- **Mandatory Field:** `estimated_hours` required on task creation
- **Time Tracking:** Every task requires time logging
- **Analysis:** Weekly report shows variance %
- **Intervention:** "You're 40% off. Adjust estimates or stop taking on so much."

### Why
Accurate estimates are critical. If you can't estimate, you can't plan. If you can't plan, you can't execute.

### Pattern Detection
The system identifies:
- **Consistently underestimating:** "You're off by 30% on average"
- **Task type patterns:** "Contracts take 2x longer than you estimate"
- **Day-of-week patterns:** "Fridays always run long"

### How to Comply

**Be honest with estimates:**
```javascript
{
  "title": "Contract Review",
  "estimated_hours": 3,  // Be realistic
  "success_criteria": "Contract reviewed, feedback provided"
}
```

**Log time accurately:**
```javascript
POST /api/tasks/{id}/time-log
{
  "hours_spent": 2.5,
  "notes": "Analysis, review, drafting feedback"
}
```

**Adjust if pattern emerges:**
- If you're consistently off by 30%, adjust future estimates UP by 30%
- If you underestimate contract work, increase by 50%
- Own the pattern and fix it

---

## Rule #7: Must Complete Weekly Report

**Status:** ENFORCED FRIDAY

### The Rule
Every Friday, you MUST complete an accountability report. Cannot skip. Cannot dismiss. Must answer:
1. "What tasks did you complete this week?"
2. "What tasks didn't you complete? Why?"
3. "What was your actual completion rate?"
4. "How accurate were your time estimates?"

### Enforcement
- **Mandatory Trigger:** Friday 5 PM accountability report required
- **Cannot Skip:** No dismissing or postponing
- **Hard Feedback:** AI provides unvarnished assessment
- **Email Notification:** Report sent as permanent record

### Why
Weekly reports create accountability. They force you to face the gap between what you planned and what you actually did.

### Example Report
```json
{
  "week": "2026-05-26 to 2026-06-01",
  "summary": {
    "tasks_planned": 12,
    "tasks_completed": 7,
    "tasks_overdue": 2,
    "blockers": 1,
    "completion_rate": "58%"
  },
  "time_analysis": {
    "estimated_hours": 28,
    "actual_hours": 35,
    "variance_percent": "+25%"
  },
  "ai_feedback": "58% completion is unacceptable. You completed less than 2/3 of planned work. What blocked you? Why are estimates 25% off?"
}
```

### How to Comply
Reports are auto-generated, but you must respond to:
- AI questions about missed tasks
- Questions about blockers
- Analysis of time variance
- Acknowledgment of trends

---

## Rule #8: Escalation Rule

**Status:** ENFORCED BY ALERTS

### The Rule
Tasks reaching certain thresholds trigger automatic escalation:

### Escalation Thresholds

**Task Overdue >3 Days:**
```
🔴 ESCALATION ALERT: "Task X" is 3 days overdue.
When will this be completed?
If cannot complete, must block with unblock date.
If cannot be resolved, must cancel with reason.
```

**Task Blocked >5 Days:**
```
⚠️ BLOCKER ESCALATION: "Task X" blocked for 5 days.
Why is this still blocked?
Who needs to be involved?
What's the path to unblock?
If cannot unblock, this task must be cancelled or escalated to leadership.
```

**Critical Task Overdue:**
```
🔴 CRITICAL ESCALATION: Critical task is overdue.
This is your top priority.
All other work must pause until this is resolved.
What do you need to complete it?
```

### Enforcement
- **Automatic Alert:** Triggered when threshold reached
- **Mandatory Response:** Must respond within 24 hours
- **Escalation Path:** Non-response escalates to leadership review
- **No Bypass:** No way to silence alerts

### How to Comply

**For overdue tasks:**
```javascript
// Complete immediately
POST /api/tasks/{id}/complete { "completion_notes": "..." }

// OR block with clear unblock date
PUT /api/tasks/{id}
{
  "status": "blocked",
  "blocked_reason": "Specific reason",
  "unblock_date": "2026-06-XX"
}

// OR cancel with reason
PUT /api/tasks/{id}
{
  "status": "cancelled",
  "archived_reason": "Documented reason"
}
```

**For blocked tasks:**
```javascript
// Unblock by removing blocker
PUT /api/tasks/{id}
{
  "status": "in_progress",
  "blocked_reason": null
}

// OR escalate for help
// (Manual process - escalate to team lead)
```

---

## Summary: The 8 Enforcement Rules

| Rule | Enforcement | Violation Response |
|------|------------|-------------------|
| #1: No Task Without Deadline | API Validation | Reject task creation |
| #2: No Snooze Button | Design Pattern | No button exists; must complete/block/cancel |
| #3: No Vague Completion | Completion Validation | Reject completion without notes |
| #4: No Indefinite Blocks | Block Validation | Reject block without unblock_date |
| #5: No Task Dumping | Limit Enforcement | Reject new task if limits exceeded |
| #6: No Estimate Lies | Time Tracking | Weekly analysis + AI intervention |
| #7: Must Complete Weekly Report | Mandatory Trigger | Cannot skip; hard feedback provided |
| #8: Escalation Rule | Alert System | Auto-escalation at time thresholds |

---

## Violation Penalties

### Minor Violation (Rule #3: Vague Completion)
- Task remains incomplete
- Must provide detailed notes
- No circumvention possible

### Major Violation (Rule #5: Task Dumping)
- Task creation rejected
- Must complete or block existing task
- System alerts: "Clear your plate first"

### Critical Violation (Rule #8: Escalation Unaddressed)
- Automatic escalation to leadership
- Review of task management process
- Mandatory meeting: "Why are we having this conversation?"

---

## Philosophy

**EXECOS Pro exists to hold you accountable.** The rules aren't arbitrary. Each one targets a specific form of self-deception:

- **Rule #1** stops "someday" thinking
- **Rule #2** stops procrastination
- **Rule #3** stops hiding incomplete work
- **Rule #4** stops ignoring problems
- **Rule #5** stops over-committing
- **Rule #6** stops lying about capacity
- **Rule #7** stops avoiding reality
- **Rule #8** stops ignoring problems until they explode

**These rules have no exceptions. No workarounds. No excuses.**

The system will enforce them. Hard. Consistently. Without mercy.

That's the point.

---

**System Version:** 1.0.0  
**Enforcement Mode:** STRICT  
**Last Updated:** June 2, 2026  
**No Exceptions. No Excuses. No Snoozing.**

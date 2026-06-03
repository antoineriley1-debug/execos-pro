# EXECOS Pro - Quick Reference Card

## 🚀 Getting Started (2 minutes)

```bash
cd execos-pro
npm install
npm run init-db
npm start
# Open: http://localhost:3000
```

## 📋 The 8 Rules (Memorize These)

| # | Rule | Consequence |
|---|------|------------|
| 1️⃣ | No Task Without Deadline | Cannot create task |
| 2️⃣ | No Snooze Button | Must complete/block/cancel |
| 3️⃣ | No Vague Completion | Cannot mark complete |
| 4️⃣ | No Indefinite Blocks | Must have unblock_date |
| 5️⃣ | No Task Dumping | Max 5 in-progress |
| 6️⃣ | No Estimate Lies | Time tracking mandatory |
| 7️⃣ | Must Complete Weekly Report | Friday mandatory |
| 8️⃣ | Escalation Rule | Auto-alerts at thresholds |

## 🎯 Daily Workflow

### 8 AM: Morning Check-In
```
Question: "What tasks are you working on today?"
Action: List your tasks
AI: Cross-checks system, flags discrepancies
Time: 2 minutes
```

### Throughout Day: Work & Track
```
Create task  → Log time  → Update status
    ↓            ↓             ↓
10 min        1 hour       Quick update
```

### 5 PM: Evening Check-Out
```
Question: "What did you complete?"
Action: Report completion
AI: "Did you finish what you said?"
Time: 2 minutes
```

### Friday 5 PM: Weekly Report
```
Auto-generated: Completion %, time variance, blockers
AI Feedback: Hard truth on performance
Review: Plan next week
Time: 10 minutes
```

## 📌 Task Creation Template

**Required Fields:**
```
Title:              "What is this task?"
Due Date:           "When? (must be future date)"
Priority:           "low / medium / high / critical"
Estimated Hours:    "How long? (be realistic)"
Success Criteria:   "How do you know it's done?"
```

**Optional:**
```
Description:        Additional context
Owner:             (default: you)
```

## 🚨 Key Alerts

| Alert | Color | Meaning | Action |
|-------|-------|---------|--------|
| Overdue Task | 🔴 RED | Task past due | Complete TODAY or block with unblock_date |
| Blocked Task | 🟡 YELLOW | Task blocked | Reason + unblock_date required |
| Today's Tasks | ⚪ WHITE | Due today | Work on these |
| Completion Rate | 🔵 BLUE | Overall % | Track weekly improvement |

## 📊 API Endpoints (Most Used)

```bash
# Create task
POST /api/tasks
{
  "title": "...",
  "due_date": "2026-06-15",
  "priority": "high",
  "estimated_hours": 2,
  "success_criteria": "..."
}

# Mark complete (REQUIRES NOTES)
POST /api/tasks/{id}/complete
{
  "completion_notes": "Detailed explanation of what was done"
}

# Log time
POST /api/tasks/{id}/time-log
{
  "hours_spent": 2.5,
  "notes": "What you actually worked on"
}

# Block task (REQUIRES UNBLOCK DATE)
PUT /api/tasks/{id}
{
  "status": "blocked",
  "blocked_reason": "Waiting for...",
  "unblock_date": "2026-06-10"
}

# Get task list
GET /api/tasks?user_id=twiney-001

# Get overdue tasks
GET /api/tasks/user/twiney-001/overdue

# Get blocked tasks
GET /api/tasks/user/twiney-001/blockers

# Weekly report
POST /api/accountability/weekly-report
```

## 🎨 Dashboard Sections

### Top Section: TODAY
Your tasks due today. First focus.

### Red Alert Section: OVERDUE
Tasks past due. Must be completed or blocked NOW.

### Yellow Alert Section: BLOCKED
Tasks blocked. Shows reason + unblock date.

### Active Section: IN PROGRESS
Tasks you're currently working on. Max 5.

### Metrics: TOP RIGHT
- Overdue count (red)
- Blocked count (yellow)
- Today count (white)
- Completion rate % (blue)

## ⏰ Daily Schedule

```
8:00 AM  → Morning check-in
9:00 AM  → Start work
12:00 PM → Mid-day review (optional)
5:00 PM  → Evening check-out
Friday   → Weekly report (mandatory)
```

## 💡 Pro Tips

### Task Estimation
- Be realistic (not optimistic)
- Add 25% buffer for unknowns
- Review historical times if available
- Adjust if consistently off

### Blocking Tasks
- Don't let task stay blocked >3 days without escalation
- Always have specific unblock reason (not "waiting")
- Set realistic unblock dates
- Review daily

### Completion Notes
- Explain what was done
- State the outcome/result
- Note any dependencies
- Flag anything that needs follow-up

### Time Logging
- Log time same day (don't wait)
- Be specific in notes
- Log interruptions/blocks
- Helps identify patterns

### Weekly Report
- Review without ego
- Look for patterns
- Note what changed week-to-week
- Plan adjustments for next week

## 🆘 Common Scenarios

### Scenario: Task is overdue
```
Option A: Complete now (requires detailed notes)
Option B: Block (requires reason + unblock_date)
Option C: Cancel (requires reason)
⚠️ Cannot push back or ignore
```

### Scenario: Too many tasks in progress
```
Count active tasks
↓ More than 5?
├─ YES: Complete or block one
└─ NO: Can create new task
```

### Scenario: Task is blocked
```
1. Document blocking reason
2. Set unblock_date
3. Plan what will unblock it
4. Check progress daily
5. After 5 days: Escalation alert
```

### Scenario: Consistently underestimating
```
System flags: "You're 40% off on contracts"
↓
Next week: Increase contract estimates by 50%
↓
Track if improvement
↓
Adjust if needed
```

## 📱 Keyboard Shortcuts (Future)

```
N     New task
C     Complete task
B     Block task
L     Log time
?     Help
```

## 🔍 Debugging

### Server won't start
```bash
lsof -i :3000        # Check port
npm install          # Reinstall deps
npm run init-db      # Reset database
```

### Database issues
```bash
rm execos-pro.db
npm run init-db
npm start
```

### Task not showing
```
localStorage.clear()  # Clear browser cache
Check user_id format
Verify task created in database
```

## 📞 Support Files

| File | What's In It |
|------|-------------|
| README.md | Full feature documentation |
| ENFORCEMENT-RULES.md | Detailed rule explanations |
| ARCHITECTURE.md | System design & data flows |
| DEPLOYMENT.md | Install, troubleshoot, deploy |
| SYSTEM-SUMMARY.md | Overview & philosophy |

## 💪 Success Formula

```
Realistic Tasks
    ↓
Accurate Estimates
    ↓
Daily Tracking
    ↓
Weekly Analysis
    ↓
Pattern Recognition
    ↓
Continuous Improvement
```

## 🎯 Monthly Goals

**Month 1:**
- Build consistency with morning/evening check-ins
- Get 70%+ completion rate
- Identify estimate patterns

**Month 2:**
- Improve to 80%+ completion
- Adjust estimates to ±15%
- Reduce blocked tasks by 50%

**Month 3:**
- Maintain 85%+ completion
- Estimates within ±10%
- Minimal blockers (clear daily)

## 🏁 The Bottom Line

**Every morning:** Report what you'll do  
**Every evening:** Report what you did  
**Every Friday:** Face the gap and adjust  

No excuses. No snoozing. No vague completions.

Just accountability.

---

**Print this. Reference daily. Own your commitments.**

*Built for people who are serious about accountability.*

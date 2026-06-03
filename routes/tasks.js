const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { isOverdue, validateTaskCreation, calculateCompletionPercentage } = require('../utils/task-utils');
const router = express.Router();

// POST /api/tasks — Create task (STRICT validation)
router.post('/', async (req, res) => {
  try {
    const {
      user_id,
      title,
      description,
      due_date,
      priority,
      owner_id,
      estimated_hours,
      success_criteria,
      time_estimate,
      related_email_id,
      related_project_id,
      related_contract_id
    } = req.body;

    // STRICT VALIDATION: No escape hatches
    const validation = validateTaskCreation(req.body);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.error });
    }

    const taskId = uuidv4();
    const now = new Date().toISOString();

    await db.run(
      `INSERT INTO tasks (
        id, user_id, title, description, due_date, priority, owner_id,
        estimated_hours, success_criteria, created_at, updated_at,
        related_email_id, related_project_id, related_contract_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        taskId, user_id, title, description, due_date, priority, owner_id,
        estimated_hours || 0, success_criteria, now, now,
        related_email_id || null, related_project_id || null, related_contract_id || null
      ]
    );

    res.status(201).json({
      success: true,
      task_id: taskId,
      message: 'Task created. No snoozing. Complete it or block it with a reason.'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks — List all tasks with filters
router.get('/', async (req, res) => {
  try {
    const { user_id, status, priority, show_all } = req.query;

    let query = 'SELECT * FROM tasks WHERE user_id = ? AND archived = FALSE';
    let params = [user_id];

    if (status) {
      query += ' AND status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND priority = ?';
      params.push(priority);
    }

    query += ' ORDER BY priority DESC, due_date ASC';

    const tasks = await db.all(query, params);

    // Calculate task health metrics
    const overdueTasks = tasks.filter(t => isOverdue(t.due_date) && t.status !== 'complete');
    const blockedTasks = tasks.filter(t => t.status === 'blocked');
    const todayTasks = tasks.filter(t => {
      const today = new Date().toDateString();
      return new Date(t.due_date).toDateString() === today;
    });

    res.json({
      total: tasks.length,
      overdue_count: overdueTasks.length,
      blocked_count: blockedTasks.length,
      today_count: todayTasks.length,
      tasks: tasks.map(t => ({
        ...t,
        overdue: isOverdue(t.due_date) && t.status !== 'complete',
        completion_percentage: calculateCompletionPercentage(t)
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks/[id] — Get task detail
router.get('/:id', async (req, res) => {
  try {
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [req.params.id]);

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Parse JSON fields
    task.time_logged = JSON.parse(task.time_logged || '[]');
    task.dependencies = JSON.parse(task.dependencies || '[]');

    // Fetch dependencies details if any
    let dependencyDetails = [];
    if (task.dependencies.length > 0) {
      const depQuery = `SELECT id, title, status FROM tasks WHERE id IN (${task.dependencies.map(() => '?').join(',')})`;
      dependencyDetails = await db.all(depQuery, task.dependencies);
    }

    res.json({
      ...task,
      dependencies_details: dependencyDetails,
      overdue: isOverdue(task.due_date) && task.status !== 'complete',
      completion_percentage: calculateCompletionPercentage(task)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/tasks/[id] — Update task
router.put('/:id', async (req, res) => {
  try {
    const { title, description, status, priority, blocked_reason, unblock_date, estimated_hours } = req.body;
    const taskId = req.params.id;

    // Fetch current task
    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // STRICT: If blocking, must provide unblock_date
    if (status === 'blocked' && !unblock_date) {
      return res.status(400).json({
        error: 'BLOCKED tasks MUST have an unblock_date. No indefinite blocks allowed.',
        rule: 'Enforcement Rule #4: No Indefinite Blocks'
      });
    }

    const now = new Date().toISOString();
    const updates = [];
    const values = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description) {
      updates.push('description = ?');
      values.push(description);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
      if (status === 'in_progress' && !task.started_at) {
        updates.push('started_at = ?');
        values.push(now);
      }
    }
    if (priority) {
      updates.push('priority = ?');
      values.push(priority);
    }
    if (blocked_reason) {
      updates.push('blocked_reason = ?');
      values.push(blocked_reason);
    }
    if (unblock_date) {
      updates.push('unblock_date = ?');
      values.push(unblock_date);
    }
    if (estimated_hours) {
      updates.push('estimated_hours = ?');
      values.push(estimated_hours);
    }

    updates.push('updated_at = ?');
    values.push(now);
    values.push(taskId);

    await db.run(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ success: true, message: 'Task updated' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks/[id]/complete — Mark complete (REQUIRES NOTE)
router.post('/:id/complete', async (req, res) => {
  try {
    const { completion_notes } = req.body;
    const taskId = req.params.id;

    // STRICT: Cannot complete without notes
    if (!completion_notes || completion_notes.trim().length === 0) {
      return res.status(400).json({
        error: 'CANNOT mark complete without detailed notes.',
        required: 'What exactly did you accomplish? What was the result?',
        rule: 'Enforcement Rule #3: No Vague Completion'
      });
    }

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // STRICT: Cannot complete if blocked
    if (task.status === 'blocked') {
      return res.status(400).json({
        error: 'Cannot mark BLOCKED task as complete.',
        action: 'Unblock the task first by resolving the blocker.'
      });
    }

    const now = new Date().toISOString();

    await db.run(
      `UPDATE tasks SET status = ?, completion_notes = ?, completed_at = ?, updated_at = ? WHERE id = ?`,
      ['complete', completion_notes, now, now, taskId]
    );

    res.json({
      success: true,
      message: 'Task marked complete',
      completion_percentage: 100
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks/[id]/time-log — Log time
router.post('/:id/time-log', async (req, res) => {
  try {
    const { user_id, hours_spent, notes } = req.body;
    const taskId = req.params.id;

    const task = await db.get('SELECT * FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const logId = uuidv4();
    const today = new Date().toISOString().split('T')[0];

    await db.run(
      `INSERT INTO task_time_logs (id, task_id, user_id, hours_spent, date_logged, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [logId, taskId, user_id, hours_spent, today, notes || '']
    );

    // Update actual_hours on task
    const newActualHours = (parseFloat(task.actual_hours) || 0) + parseFloat(hours_spent);
    await db.run(
      `UPDATE tasks SET actual_hours = ?, updated_at = ? WHERE id = ?`,
      [newActualHours, new Date().toISOString(), taskId]
    );

    res.status(201).json({
      success: true,
      log_id: logId,
      total_hours_so_far: newActualHours,
      estimated: task.estimated_hours,
      variance: newActualHours - task.estimated_hours
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks/overdue — Get overdue tasks
router.get('/user/:user_id/overdue', async (req, res) => {
  try {
    const overdueTasks = await db.all(
      `SELECT * FROM tasks 
       WHERE user_id = ? AND status != 'complete' AND status != 'cancelled'
       AND due_date < datetime('now')
       ORDER BY due_date ASC`,
      [req.params.user_id]
    );

    res.json({
      overdue_count: overdueTasks.length,
      severity: overdueTasks.length > 0 ? 'CRITICAL' : 'NONE',
      tasks: overdueTasks.map(t => ({
        ...t,
        days_overdue: Math.floor((Date.now() - new Date(t.due_date)) / (1000 * 60 * 60 * 24)),
        urgent: true
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks/blockers — Get blocked tasks
router.get('/user/:user_id/blockers', async (req, res) => {
  try {
    const blockedTasks = await db.all(
      `SELECT * FROM tasks 
       WHERE user_id = ? AND status = 'blocked'
       ORDER BY unblock_date ASC`,
      [req.params.user_id]
    );

    res.json({
      blocked_count: blockedTasks.length,
      tasks: blockedTasks.map(t => ({
        ...t,
        days_blocked: Math.floor((Date.now() - new Date(t.created_at)) / (1000 * 60 * 60 * 24)),
        escalation_needed: Math.floor((Date.now() - new Date(t.created_at)) / (1000 * 60 * 60 * 24)) > 5
      }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;

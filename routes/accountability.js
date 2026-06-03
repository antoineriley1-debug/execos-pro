const express = require('express');
const { v4: uuidv4 } = require('uuid');
const db = require('../db');
const { getWeekRange } = require('../utils/date-utils');
const router = express.Router();

// POST /api/accountability/daily-checkin — Morning check-in
router.post('/daily-checkin/morning', async (req, res) => {
  try {
    const { user_id, tasks_listed } = req.body;

    if (!tasks_listed || tasks_listed.length === 0) {
      return res.status(400).json({
        error: 'You must list your tasks for today. No skipping accountability.',
        question: 'What tasks are you working on today?'
      });
    }

    const checkInId = uuidv4();
    const today = new Date().toISOString().split('T')[0];

    // Get system tasks for today
    const systemTasks = await db.all(
      `SELECT id, title, status FROM tasks 
       WHERE user_id = ? AND date(due_date) = ?`,
      [user_id, today]
    );

    // Cross-reference
    const systemTaskIds = systemTasks.map(t => t.id);
    const listedNotInSystem = tasks_listed.filter(t => !systemTaskIds.includes(t));

    let aiResponse = {
      acknowledged_tasks: systemTasks.length,
      tasks_in_system: systemTasks.length,
      status: systemTasks.length > 0 ? 'READY' : 'LIGHT'
    };

    if (systemTasks.length === 0) {
      aiResponse.ai_comment = '⚠️ You have no tasks in the system for today. Add them NOW.';
      aiResponse.feedback = 'ACCOUNTABILITY CHECK FAILED: Tasks not in system';
    } else if (listedNotInSystem.length > 0) {
      aiResponse.ai_comment = `⚠️ You listed tasks not in the system: ${listedNotInSystem.join(', ')}. Add them immediately.`;
      aiResponse.feedback = 'DISCREPANCY: Your list doesn\'t match the system';
    } else {
      aiResponse.ai_comment = `✓ Tasks acknowledged. Total: ${systemTasks.length}. Now execute.`;
      aiResponse.feedback = 'ALIGNED';
    }

    await db.run(
      `INSERT INTO daily_checkins (id, user_id, checkin_date, checkin_type, tasks_listed)
       VALUES (?, ?, ?, ?, ?)`,
      [checkInId, user_id, today, 'morning', JSON.stringify(tasks_listed)]
    );

    res.json(aiResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/accountability/daily-checkin/evening — End of day check-out
router.post('/daily-checkin/evening', async (req, res) => {
  try {
    const { user_id, tasks_completed } = req.body;

    if (!tasks_completed || tasks_completed.length === 0) {
      return res.status(400).json({
        error: 'You must report what you completed. No skipping.',
        question: 'What did you actually finish today?'
      });
    }

    const checkInId = uuidv4();
    const today = new Date().toISOString().split('T')[0];

    // Get today's tasks
    const todayTasks = await db.all(
      `SELECT id, title, status, estimated_hours, actual_hours FROM tasks 
       WHERE user_id = ? AND date(due_date) = ?`,
      [user_id, today]
    );

    const completedCount = todayTasks.filter(t => t.status === 'complete').length;
    const completionRate = todayTasks.length > 0 ? (completedCount / todayTasks.length) * 100 : 0;

    // Hard feedback
    let aiResponse = {
      tasks_planned: todayTasks.length,
      tasks_completed: completedCount,
      completion_rate: completionRate.toFixed(1) + '%',
      feedback: []
    };

    // Check for discrepancies
    if (completedCount < todayTasks.length) {
      const uncompleted = todayTasks.filter(t => t.status !== 'complete');
      aiResponse.feedback.push(`❌ NOT COMPLETED: ${uncompleted.map(t => t.title).join(', ')}`);
      aiResponse.feedback.push('Why were these not finished? What blocked you?');
    }

    // Time analysis
    const totalTimeLogged = todayTasks.reduce((sum, t) => sum + (parseFloat(t.actual_hours) || 0), 0);
    const totalTimeEstimated = todayTasks.reduce((sum, t) => sum + (parseFloat(t.estimated_hours) || 0), 0);
    const timeVariance = totalTimeLogged - totalTimeEstimated;

    if (timeVariance > totalTimeEstimated * 0.25) {
      aiResponse.feedback.push(`⚠️ TIME OVERRUN: Estimated ${totalTimeEstimated}h, spent ${totalTimeLogged}h (+${timeVariance.toFixed(1)}h)`);
      aiResponse.feedback.push('You are underestimating. Adjust your estimates or stop taking on so much.');
    }

    aiResponse.hard_feedback = aiResponse.feedback.join('\n');

    await db.run(
      `INSERT INTO daily_checkins (id, user_id, checkin_date, checkin_type, tasks_reported, ai_response)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [checkInId, user_id, today, 'evening', JSON.stringify(tasks_completed), aiResponse.hard_feedback]
    );

    res.json(aiResponse);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/accountability/weekly-report — Generate weekly report
router.post('/weekly-report', async (req, res) => {
  try {
    const { user_id } = req.body;
    const { weekStart, weekEnd } = getWeekRange();

    // Get all tasks for the week
    const weekTasks = await db.all(
      `SELECT * FROM tasks 
       WHERE user_id = ? AND date(created_at) >= ? AND date(created_at) <= ?`,
      [user_id, weekStart, weekEnd]
    );

    const completedTasks = weekTasks.filter(t => t.status === 'complete');
    const overdueTasks = weekTasks.filter(t => t.status !== 'complete' && new Date(t.due_date) < new Date());
    const blockedTasks = weekTasks.filter(t => t.status === 'blocked');

    const totalHoursEstimated = weekTasks.reduce((sum, t) => sum + (parseFloat(t.estimated_hours) || 0), 0);
    const totalHoursActual = weekTasks.reduce((sum, t) => sum + (parseFloat(t.actual_hours) || 0), 0);
    const timeVariance = ((totalHoursActual - totalHoursEstimated) / totalHoursEstimated) * 100;
    const completionRate = weekTasks.length > 0 ? (completedTasks.length / weekTasks.length) * 100 : 0;

    const reportId = uuidv4();
    const now = new Date().toISOString();

    // AI Feedback
    const aiFeedback = generateHardFeedback(
      completionRate,
      timeVariance,
      blockedTasks.length,
      overdueTasks.length,
      completedTasks.length,
      weekTasks.length
    );

    await db.run(
      `INSERT INTO accountability_reports 
       (id, user_id, report_date, week_start_date, week_end_date, tasks_planned, tasks_completed, 
        tasks_overdue, total_hours_estimated, total_hours_actual, time_variance_percent, 
        completion_rate, blockers_count, ai_feedback)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        reportId, user_id, new Date().toISOString().split('T')[0], weekStart, weekEnd,
        weekTasks.length, completedTasks.length, overdueTasks.length,
        totalHoursEstimated, totalHoursActual, timeVariance,
        completionRate, blockedTasks.length, aiFeedback
      ]
    );

    res.json({
      report_id: reportId,
      week: `${weekStart} to ${weekEnd}`,
      summary: {
        tasks_planned: weekTasks.length,
        tasks_completed: completedTasks.length,
        tasks_overdue: overdueTasks.length,
        blockers: blockedTasks.length,
        completion_rate: completionRate.toFixed(1) + '%'
      },
      time_analysis: {
        estimated_hours: totalHoursEstimated.toFixed(1),
        actual_hours: totalHoursActual.toFixed(1),
        variance_percent: timeVariance.toFixed(1) + '%',
        assessment: timeVariance > 20 ? '❌ SIGNIFICANTLY OVERESTIMATING' : timeVariance < -20 ? '⚠️ SEVERELY UNDERESTIMATING' : '✓ REASONABLE'
      },
      ai_feedback: aiFeedback,
      completed_tasks: completedTasks.map(t => ({ title: t.title, priority: t.priority })),
      missed_tasks: weekTasks.filter(t => t.status !== 'complete').map(t => ({ title: t.title, status: t.status })),
      blocked_tasks: blockedTasks.map(t => ({ title: t.title, reason: t.blocked_reason }))
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Helper function for hard feedback
function generateHardFeedback(completionRate, timeVariance, blockerCount, overdueCount, completed, total) {
  const feedback = [];

  if (completionRate < 60) {
    feedback.push(`🔴 CRITICAL: Only ${completionRate.toFixed(0)}% of tasks completed. This is unacceptable.`);
  } else if (completionRate < 80) {
    feedback.push(`⚠️ WARNING: ${completionRate.toFixed(0)}% completion. You're behind.`);
  } else {
    feedback.push(`✓ ${completionRate.toFixed(0)}% completion. Acceptable.`);
  }

  if (Math.abs(timeVariance) > 40) {
    feedback.push(`❌ Your estimates are off by ${Math.abs(timeVariance).toFixed(0)}%. Learn to estimate properly.`);
  }

  if (blockerCount > 0) {
    feedback.push(`⚠️ ${blockerCount} tasks blocked. What's holding you back?`);
  }

  if (overdueCount > 0) {
    feedback.push(`🔴 ${overdueCount} tasks overdue. Escalate or complete immediately.`);
  }

  return feedback.join('\n');
}

module.exports = router;

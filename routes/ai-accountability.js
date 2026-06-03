const express = require('express');
const db = require('../db');
const router = express.Router();

// POST /api/ai/accountability-check — AI Accountability Check
router.post('/accountability-check', async (req, res) => {
  try {
    const { user_id, check_type } = req.body; // check_type: 'morning' | 'evening' | 'blocker' | 'priority'

    if (check_type === 'morning') {
      const response = await morningCheck(user_id);
      res.json(response);
    } else if (check_type === 'evening') {
      const response = await eveningCheck(user_id);
      res.json(response);
    } else if (check_type === 'blocker') {
      const response = await blockerCheck(user_id);
      res.json(response);
    } else if (check_type === 'priority') {
      const response = await priorityCheck(user_id);
      res.json(response);
    } else {
      res.status(400).json({ error: 'Invalid check_type' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/ai/performance-report — Performance Analysis
router.post('/performance-report', async (req, res) => {
  try {
    const { user_id, period } = req.body; // period: 'week' | 'month'

    const reports = await db.all(
      `SELECT * FROM accountability_reports 
       WHERE user_id = ?
       ORDER BY week_start_date DESC
       LIMIT ?`,
      [user_id, period === 'month' ? 4 : 1]
    );

    if (reports.length === 0) {
      return res.json({ message: 'No reports available yet' });
    }

    // Calculate trends
    const avgCompletion = reports.reduce((sum, r) => sum + r.completion_rate, 0) / reports.length;
    const avgTimeVariance = reports.reduce((sum, r) => sum + r.time_variance_percent, 0) / reports.length;
    const avgBlockers = reports.reduce((sum, r) => sum + r.blockers_count, 0) / reports.length;

    const trend = reports.length > 1 
      ? reports[0].completion_rate > reports[reports.length - 1].completion_rate 
        ? 'improving' 
        : 'declining'
      : 'stable';

    const analysis = {
      period,
      reports_analyzed: reports.length,
      trends: {
        average_completion_rate: avgCompletion.toFixed(1) + '%',
        average_time_variance: avgTimeVariance.toFixed(1) + '%',
        average_blockers_per_week: avgBlockers.toFixed(1),
        trend_direction: trend
      },
      insights: generateInsights(avgCompletion, avgTimeVariance, avgBlockers, trend),
      hard_feedback: generatePerformanceFeedback(avgCompletion, avgTimeVariance, trend)
    };

    res.json(analysis);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/ai/trends — Trend Analysis
router.get('/trends/:user_id', async (req, res) => {
  try {
    const reports = await db.all(
      `SELECT * FROM accountability_reports 
       WHERE user_id = ?
       ORDER BY week_start_date DESC
       LIMIT 12`,
      [req.params.user_id]
    );

    if (reports.length < 2) {
      return res.json({ message: 'Insufficient data for trend analysis' });
    }

    // Reverse to chronological order
    reports.reverse();

    // Analyze patterns
    const patterns = {
      completion_trend: analyzeTrend(reports.map(r => r.completion_rate)),
      time_variance_trend: analyzeTrend(reports.map(r => r.time_variance_percent)),
      blocker_trend: analyzeTrend(reports.map(r => r.blockers_count)),
      worst_day_of_week: findWorstDayPattern(reports),
      slowest_task_type: findSlowestTaskType(reports),
      biggest_time_drain: 'Analysis pending'
    };

    res.json({
      data_points: reports.length,
      period_range: `${reports[0].week_start_date} to ${reports[reports.length - 1].week_end_date}`,
      patterns,
      recommendations: generateRecommendations(patterns)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============ HELPER FUNCTIONS ============

async function morningCheck(user_id) {
  const today = new Date().toISOString().split('T')[0];
  
  const todayTasks = await db.all(
    `SELECT * FROM tasks 
     WHERE user_id = ? AND date(due_date) = ? AND status != 'complete'`,
    [user_id, today]
  );

  const totalHours = todayTasks.reduce((sum, t) => sum + (parseFloat(t.estimated_hours) || 0), 0);

  return {
    timestamp: new Date().toISOString(),
    question: '📋 Good morning. What are your tasks for today?',
    tasks_in_system: todayTasks.length,
    total_hours_planned: totalHours,
    ai_prompt: totalHours < 4 
      ? `⚠️ That's only ${totalHours}h of work. Are you sure? You need 6-8 hours of committed work.`
      : totalHours > 12
      ? `⚠️ That's ${totalHours}h of work. That's too much. Prioritize ruthlessly.`
      : `✓ ${totalHours}h of work planned. Now execute without excuses.`,
    task_list: todayTasks.map(t => ({ id: t.id, title: t.title, priority: t.priority }))
  };
}

async function eveningCheck(user_id) {
  const today = new Date().toISOString().split('T')[0];
  
  const todayTasks = await db.all(
    `SELECT * FROM tasks 
     WHERE user_id = ? AND date(due_date) = ?`,
    [user_id, today]
  );

  const completed = todayTasks.filter(t => t.status === 'complete');
  const incomplete = todayTasks.filter(t => t.status !== 'complete');

  const feedback = [];
  
  if (incomplete.length > 0) {
    feedback.push(`❌ You didn't complete: ${incomplete.map(t => t.title).join(', ')}`);
    incomplete.forEach(t => {
      if (t.status === 'blocked') {
        feedback.push(`  - BLOCKED: ${t.blocked_reason}`);
      } else if (t.status === 'in_progress') {
        feedback.push(`  - IN PROGRESS: Why isn't this done?`);
      } else {
        feedback.push(`  - NOT STARTED: What stopped you?`);
      }
    });
  }

  return {
    timestamp: new Date().toISOString(),
    question: '📊 Evening Check: What did you complete today?',
    completed: completed.length,
    incomplete: incomplete.length,
    completion_rate: todayTasks.length > 0 ? ((completed.length / todayTasks.length) * 100).toFixed(0) + '%' : 'N/A',
    hard_feedback: feedback.length > 0 ? feedback.join('\n') : '✓ Good day. Continue this pace.',
    require_response: incomplete.length > 0
  };
}

async function blockerCheck(user_id) {
  const blockedTasks = await db.all(
    `SELECT * FROM tasks 
     WHERE user_id = ? AND status = 'blocked'`,
    [user_id]
  );

  const escalationNeeded = blockedTasks.filter(t => {
    const daysBlocked = Math.floor((Date.now() - new Date(t.created_at)) / (1000 * 60 * 60 * 24));
    return daysBlocked > 5;
  });

  const feedback = [];

  if (blockedTasks.length > 0) {
    feedback.push(`⚠️ You have ${blockedTasks.length} blocked task(s).`);
    blockedTasks.forEach(t => {
      const daysBlocked = Math.floor((Date.now() - new Date(t.created_at)) / (1000 * 60 * 60 * 24));
      feedback.push(`\n📌 "${t.title}" - blocked for ${daysBlocked} days`);
      feedback.push(`   Reason: ${t.blocked_reason}`);
      feedback.push(`   Unblock by: ${t.unblock_date}`);
      if (daysBlocked > 5) {
        feedback.push(`   🔴 ESCALATION REQUIRED - This is too long.`);
      }
    });
  }

  return {
    blocked_count: blockedTasks.length,
    escalation_count: escalationNeeded.length,
    hard_feedback: feedback.join(''),
    action_required: blockedTasks.length > 0 ? 'Resolve blockers NOW' : 'None'
  };
}

async function priorityCheck(user_id) {
  const activeTasks = await db.all(
    `SELECT * FROM tasks 
     WHERE user_id = ? AND status IN ('not_started', 'in_progress')
     AND archived = FALSE`,
    [user_id]
  );

  const criticalTasks = activeTasks.filter(t => t.priority === 'critical');
  const highTasks = activeTasks.filter(t => t.priority === 'high');

  const feedback = [];

  if (criticalTasks.length > 2) {
    feedback.push(`🔴 CRITICAL: You have ${criticalTasks.length} CRITICAL tasks. Only 1 can truly be critical.`);
    feedback.push('Reprioritize NOW or you\'ll fail them all.');
  } else if (criticalTasks.length > 0) {
    feedback.push(`✓ ${criticalTasks.length} critical task(s) - focused.`);
  }

  if (activeTasks.length > 5) {
    feedback.push(`⚠️ You're juggling ${activeTasks.length} active tasks. Too many in progress.`);
    feedback.push('Complete or block some to focus.');
  }

  return {
    active_tasks: activeTasks.length,
    critical_count: criticalTasks.length,
    high_count: highTasks.length,
    priority_violation: criticalTasks.length > 2 ? true : false,
    hard_feedback: feedback.join('\n'),
    action_required: criticalTasks.length > 2 || activeTasks.length > 5
  };
}

function analyzeTrend(dataPoints) {
  if (dataPoints.length < 2) return 'insufficient_data';
  
  const recent = dataPoints.slice(-3).reduce((a, b) => a + b) / 3;
  const past = dataPoints.slice(0, 3).reduce((a, b) => a + b) / 3;
  
  if (recent > past * 1.1) return 'improving';
  if (recent < past * 0.9) return 'declining';
  return 'stable';
}

function findWorstDayPattern(reports) {
  // Placeholder - would analyze actual day patterns
  return 'Friday (most blocked)';
}

function findSlowestTaskType(reports) {
  // Placeholder - would analyze task type performance
  return 'Contract reviews (40% over estimate)';
}

function generateInsights(completion, variance, blockers, trend) {
  const insights = [];
  
  if (completion < 70) {
    insights.push('Your completion rate is below 70%. You\'re overcommitting.');
  }
  if (Math.abs(variance) > 30) {
    insights.push('Your estimates are wildly off. Start tracking more accurately.');
  }
  if (blockers > 2) {
    insights.push('You have chronic blockers. Identify root causes.');
  }
  if (trend === 'declining') {
    insights.push('Your performance is declining week-over-week. Investigate why.');
  }
  
  return insights;
}

function generatePercommendations(patterns) {
  const recs = [];
  
  if (patterns.completion_trend === 'declining') {
    recs.push('1. Review your task definitions - are they realistic?');
    recs.push('2. Cut task volume by 30% until you stabilize');
    recs.push('3. Daily check-ins to catch problems early');
  }
  
  return recs;
}

function generatePerformanceFeedback(completion, variance, trend) {
  if (completion < 50) {
    return 'This is unacceptable. You completed less than half your planned tasks. Stop accepting new work until you catch up.';
  }
  if (completion < 70) {
    return 'You\'re below 70% completion. You\'re taking on too much. Get realistic about what you can do.';
  }
  if (completion >= 85) {
    return 'Good work. You\'re maintaining accountability. Keep this pace.';
  }
  return 'Acceptable. Room for improvement.';
}

module.exports = router;

/**
 * Task Utility Functions
 * Enforce STRICT task management rules
 */

/**
 * Validate task creation against STRICT rules
 */
function validateTaskCreation(data) {
  const { title, due_date, priority, estimated_hours, success_criteria } = data;

  if (!title || title.trim().length === 0) {
    return { valid: false, error: 'Title is required' };
  }

  if (!due_date) {
    return { 
      valid: false, 
      error: 'ENFORCEMENT RULE #1: All tasks MUST have a deadline. No exceptions.',
      rule: 'No Task Without Deadline'
    };
  }

  // Validate due_date is in the future
  if (new Date(due_date) < new Date()) {
    return { 
      valid: false, 
      error: 'Due date must be in the future'
    };
  }

  if (!priority || !['low', 'medium', 'high', 'critical'].includes(priority)) {
    return { 
      valid: false, 
      error: 'STRICT: Priority is required (low, medium, high, or critical). No skipping.',
      rule: 'Priority Enforcement'
    };
  }

  if (!estimated_hours || estimated_hours <= 0) {
    return { 
      valid: false, 
      error: 'Time estimate is required. Estimate your effort.'
    };
  }

  if (!success_criteria || success_criteria.trim().length === 0) {
    return { 
      valid: false, 
      error: 'STRICT: Success criteria required. How will you know this is done?',
      rule: 'Completion Requirements'
    };
  }

  return { valid: true };
}

/**
 * Check if task is overdue
 */
function isOverdue(dueDate) {
  return new Date(dueDate) < new Date() && new Date(dueDate).toDateString() !== new Date().toDateString();
}

/**
 * Calculate completion percentage (actual vs estimated)
 */
function calculateCompletionPercentage(task) {
  if (task.status === 'complete') {
    return 100;
  }

  if (task.status === 'cancelled') {
    return 0;
  }

  if (!task.estimated_hours || task.estimated_hours === 0) {
    return 0;
  }

  const percentage = (task.actual_hours / task.estimated_hours) * 100;
  return Math.min(percentage, 99); // Cap at 99% if actual exceeds estimate
}

/**
 * Enforce maximum critical tasks
 */
function validateCriticalLimit(existingCriticalTasks, newPriority) {
  if (newPriority === 'critical' && existingCriticalTasks.length >= 1) {
    return {
      valid: false,
      error: 'PRIORITY ENFORCEMENT: You already have a critical task. Only 1 task can be critical at a time.',
      action: 'Reduce another task priority or complete the existing critical task first.'
    };
  }
  return { valid: true };
}

/**
 * Enforce maximum in-progress tasks
 */
function validateInProgressLimit(inProgressTasks) {
  const MAX_IN_PROGRESS = 5;
  
  if (inProgressTasks.length >= MAX_IN_PROGRESS) {
    return {
      valid: false,
      error: `TASK DUMPING PREVENTION: You have ${MAX_IN_PROGRESS} tasks in progress. No more until you complete some.`,
      rule: 'No Task Dumping'
    };
  }
  return { valid: true };
}

/**
 * Check if user can start a new task
 */
function canStartNewTask(inProgressTasks, overdueTasks, criticalTasks) {
  const issues = [];

  if (inProgressTasks.length >= 5) {
    issues.push('You have 5 tasks already in progress. Complete one first.');
  }

  if (overdueTasks.length > 0) {
    issues.push(`You have ${overdueTasks.length} overdue task(s). Cannot start new work until overdue tasks are handled.`);
  }

  if (criticalTasks.some(t => t.status !== 'complete')) {
    const incompleteCore = criticalTasks.filter(t => t.status !== 'complete');
    issues.push(`You have ${incompleteCore.length} incomplete CRITICAL task(s). Focus on those first.`);
  }

  return {
    allowed: issues.length === 0,
    issues,
    message: issues.length > 0 
      ? `BLOCKED: ${issues.join(' ')}` 
      : 'You may start a new task.'
  };
}

/**
 * Estimate time variance and flag issues
 */
function analyzeTimeVariance(task) {
  if (task.status !== 'complete' || !task.actual_hours) {
    return { variance: null, status: 'incomplete' };
  }

  const variance = ((task.actual_hours - task.estimated_hours) / task.estimated_hours) * 100;

  let assessment = 'accurate';
  if (variance > 50) assessment = 'severely_underestimated';
  else if (variance > 25) assessment = 'underestimated';
  else if (variance < -25) assessment = 'overestimated';

  return {
    variance: variance.toFixed(1),
    assessment,
    flag: Math.abs(variance) > 30
  };
}

/**
 * Check for estimate lies pattern
 */
function hasEstimateLiePattern(completedTasks) {
  if (completedTasks.length < 5) return false;

  const variances = completedTasks.map(t => {
    if (!t.actual_hours) return 0;
    return ((t.actual_hours - t.estimated_hours) / t.estimated_hours) * 100;
  });

  const avgVariance = variances.reduce((a, b) => a + b) / variances.length;
  const consistentUnderestimate = variances.filter(v => v > 25).length / variances.length > 0.7;

  return {
    hasPattern: consistentUnderestimate,
    avgVariance: avgVariance.toFixed(1),
    message: consistentUnderestimate 
      ? 'You consistently underestimate tasks by ~' + Math.abs(avgVariance).toFixed(0) + '%. Adjust your estimates or stop taking on so much.'
      : null
  };
}

module.exports = {
  validateTaskCreation,
  isOverdue,
  calculateCompletionPercentage,
  validateCriticalLimit,
  validateInProgressLimit,
  canStartNewTask,
  analyzeTimeVariance,
  hasEstimateLiePattern
};

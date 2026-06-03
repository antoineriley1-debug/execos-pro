/**
 * Date Utility Functions
 */

function getWeekRange(date = new Date()) {
  const curr = new Date(date);
  const first = curr.getDate() - curr.getDay();
  const last = first + 6;

  const weekStart = new Date(curr.setDate(first)).toISOString().split('T')[0];
  const weekEnd = new Date(curr.setDate(last)).toISOString().split('T')[0];

  return { weekStart, weekEnd };
}

function getMonthRange(date = new Date()) {
  const year = date.getFullYear();
  const month = date.getMonth();

  const monthStart = new Date(year, month, 1).toISOString().split('T')[0];
  const monthEnd = new Date(year, month + 1, 0).toISOString().split('T')[0];

  return { monthStart, monthEnd };
}

function getDaysUntilDue(dueDate) {
  const due = new Date(dueDate);
  const today = new Date();
  const diff = due - today;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

function isToday(dateString) {
  return new Date(dateString).toDateString() === new Date().toDateString();
}

function isOverdue(dateString) {
  return new Date(dateString) < new Date();
}

module.exports = {
  getWeekRange,
  getMonthRange,
  getDaysUntilDue,
  isToday,
  isOverdue
};

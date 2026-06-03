-- EXECOS Pro: Strict Accountability Task Management System
-- Database Schema

-- ============================================================================
-- USERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    timezone TEXT DEFAULT 'America/New_York',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- TASKS TABLE (Core Task Management)
-- ============================================================================
CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TIMESTAMP NOT NULL,
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    owner_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'not_started' CHECK (status IN ('not_started', 'in_progress', 'blocked', 'complete', 'cancelled')),
    estimated_hours REAL NOT NULL,
    actual_hours REAL DEFAULT 0,
    time_logged TEXT DEFAULT '[]', -- JSON array of time entries
    success_criteria TEXT NOT NULL,
    completion_notes TEXT,
    blocked_reason TEXT,
    unblock_date TIMESTAMP,
    dependencies TEXT DEFAULT '[]', -- JSON array of task IDs
    related_email_id TEXT,
    related_project_id TEXT,
    related_contract_id TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    started_at TIMESTAMP,
    completed_at TIMESTAMP,
    archived BOOLEAN DEFAULT FALSE,
    archived_reason TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (owner_id) REFERENCES users(id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tasks_user_status ON tasks(user_id, status);
CREATE INDEX IF NOT EXISTS idx_tasks_user_due ON tasks(user_id, due_date);
CREATE INDEX IF NOT EXISTS idx_tasks_user_priority ON tasks(user_id, priority);
CREATE INDEX IF NOT EXISTS idx_tasks_overdue ON tasks(user_id, status, due_date) WHERE status != 'complete' AND status != 'cancelled';
CREATE INDEX IF NOT EXISTS idx_tasks_blocked ON tasks(user_id, status) WHERE status = 'blocked';

-- ============================================================================
-- TASK TIME LOGS TABLE (Time Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS task_time_logs (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    hours_spent REAL NOT NULL,
    date_logged DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_time_logs_task ON task_time_logs(task_id);
CREATE INDEX IF NOT EXISTS idx_time_logs_user_date ON task_time_logs(user_id, date_logged);

-- ============================================================================
-- ACCOUNTABILITY REPORTS TABLE (Weekly/Historical Tracking)
-- ============================================================================
CREATE TABLE IF NOT EXISTS accountability_reports (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    report_date DATE NOT NULL,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    tasks_planned INTEGER NOT NULL,
    tasks_completed INTEGER NOT NULL,
    tasks_overdue INTEGER NOT NULL,
    total_hours_estimated REAL NOT NULL,
    total_hours_actual REAL NOT NULL,
    time_variance_percent REAL NOT NULL,
    completion_rate REAL NOT NULL,
    blockers_count INTEGER NOT NULL,
    blockers_list TEXT DEFAULT '[]', -- JSON array of blocker details
    ai_feedback TEXT,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, week_start_date)
);

CREATE INDEX IF NOT EXISTS idx_reports_user_date ON accountability_reports(user_id, week_start_date);

-- ============================================================================
-- DAILY CHECK-INS TABLE (Morning/Evening Accountability)
-- ============================================================================
CREATE TABLE IF NOT EXISTS daily_checkins (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    checkin_date DATE NOT NULL,
    checkin_type TEXT NOT NULL CHECK (checkin_type IN ('morning', 'evening')),
    tasks_listed TEXT NOT NULL, -- JSON array of task titles/IDs
    tasks_reported TEXT, -- JSON array (evening only)
    ai_response TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON daily_checkins(user_id, checkin_date);

-- ============================================================================
-- PRIORITY ENFORCEMENT TABLE (Track active/high priority count)
-- ============================================================================
CREATE TABLE IF NOT EXISTS priority_enforcement (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    enforcement_date DATE NOT NULL,
    critical_count INTEGER NOT NULL,
    high_count INTEGER NOT NULL,
    total_in_progress INTEGER NOT NULL,
    ai_alert TEXT,
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- ============================================================================
-- BLOCKER TRACKING TABLE (Escalation & Follow-up)
-- ============================================================================
CREATE TABLE IF NOT EXISTS blocker_tracking (
    id TEXT PRIMARY KEY,
    task_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    blocker_reason TEXT NOT NULL,
    unblock_date TIMESTAMP NOT NULL,
    days_blocked INTEGER NOT NULL,
    escalation_level INTEGER DEFAULT 0, -- 0: none, 1: 5-day warning, 2: escalation required
    escalation_sent BOOLEAN DEFAULT FALSE,
    escalation_date TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (task_id) REFERENCES tasks(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE INDEX IF NOT EXISTS idx_blockers_user_task ON blocker_tracking(user_id, task_id);
CREATE INDEX IF NOT EXISTS idx_blockers_escalation ON blocker_tracking(user_id, escalation_level);

-- ============================================================================
-- TREND ANALYSIS TABLE (Historical Performance Metrics)
-- ============================================================================
CREATE TABLE IF NOT EXISTS trend_analysis (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    analysis_period TEXT NOT NULL, -- 'weekly' or 'monthly'
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    avg_completion_rate REAL NOT NULL,
    avg_time_variance REAL NOT NULL,
    avg_blockers_per_week REAL NOT NULL,
    trend_direction TEXT NOT NULL CHECK (trend_direction IN ('improving', 'stable', 'declining')),
    insights TEXT NOT NULL, -- JSON array of trend insights
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE(user_id, analysis_period, period_start_date)
);

-- ============================================================================
-- ENFORCEMENT VIOLATIONS TABLE (Track rule violations)
-- ============================================================================
CREATE TABLE IF NOT EXISTS enforcement_violations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    violation_type TEXT NOT NULL,
    violation_details TEXT NOT NULL,
    task_id TEXT,
    severity TEXT NOT NULL CHECK (severity IN ('warning', 'critical')),
    acknowledged BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (task_id) REFERENCES tasks(id)
);

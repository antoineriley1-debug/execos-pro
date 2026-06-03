/**
 * EXECOS Pro - Accountability Dashboard
 * Strict Task Management System
 */

const API_BASE = 'http://localhost:3000/api';

class ExecutosApp {
    constructor() {
        this.userId = localStorage.getItem('userId') || 'twiney-001';
        this.tasks = [];
        this.currentView = 'dashboard';
        this.init();
    }

    init() {
        this.setupDOM();
        this.loadTasks();
        this.setupEventListeners();
        this.renderDashboard();
    }

    setupDOM() {
        const root = document.getElementById('root');
        root.innerHTML = `
            <div class="container">
                <div class="header">
                    <div>
                        <h1>🎯 EXECOS PRO</h1>
                        <div class="subtitle">Accountability Task Management System</div>
                    </div>
                    <div class="header-mode">STRICT MODE</div>
                </div>
                
                <div class="tabs">
                    <button class="tab active" data-view="dashboard">Dashboard</button>
                    <button class="tab" data-view="tasks">All Tasks</button>
                    <button class="tab" data-view="create">Create Task</button>
                    <button class="tab" data-view="time-log">Time Log</button>
                    <button class="tab" data-view="accountability">Accountability</button>
                </div>
                
                <div id="content"></div>
                <div id="modal" class="modal"></div>
            </div>
        `;
    }

    setupEventListeners() {
        document.querySelectorAll('.tab').forEach(tab => {
            tab.addEventListener('click', (e) => {
                document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
                e.target.classList.add('active');
                this.currentView = e.target.dataset.view;
                this.render();
            });
        });
    }

    async loadTasks() {
        try {
            const response = await fetch(`${API_BASE}/tasks?user_id=${this.userId}`);
            const data = await response.json();
            this.tasks = data.tasks || [];
        } catch (error) {
            console.error('Failed to load tasks:', error);
            this.tasks = [];
        }
    }

    render() {
        const content = document.getElementById('content');
        
        switch (this.currentView) {
            case 'dashboard':
                content.innerHTML = this.renderDashboard();
                break;
            case 'tasks':
                content.innerHTML = this.renderAllTasks();
                break;
            case 'create':
                content.innerHTML = this.renderCreateTask();
                break;
            case 'time-log':
                content.innerHTML = this.renderTimeLog();
                break;
            case 'accountability':
                content.innerHTML = this.renderAccountability();
                break;
        }
    }

    renderDashboard() {
        const overdueTasks = this.tasks.filter(t => t.overdue && t.status !== 'complete');
        const blockedTasks = this.tasks.filter(t => t.status === 'blocked');
        const todayTasks = this.tasks.filter(t => this.isToday(t.due_date) && t.status !== 'complete');
        const inProgressTasks = this.tasks.filter(t => t.status === 'in_progress');

        const completionRate = this.tasks.length > 0 
            ? ((this.tasks.filter(t => t.status === 'complete').length / this.tasks.length) * 100).toFixed(1)
            : 0;

        return `
            <div class="metrics">
                <div class="metric-box">
                    <div class="metric-value critical">${overdueTasks.length}</div>
                    <div class="metric-label">Overdue Tasks</div>
                </div>
                <div class="metric-box">
                    <div class="metric-value warning">${blockedTasks.length}</div>
                    <div class="metric-label">Blocked Tasks</div>
                </div>
                <div class="metric-box">
                    <div class="metric-value">${todayTasks.length}</div>
                    <div class="metric-label">Due Today</div>
                </div>
                <div class="metric-box">
                    <div class="metric-value success">${completionRate}%</div>
                    <div class="metric-label">Completion Rate</div>
                </div>
            </div>

            <div class="dashboard">
                <div class="dashboard-card">
                    <h3>⚠️ CRITICAL: Overdue Tasks</h3>
                    ${overdueTasks.length > 0 ? `
                        <div class="alert-section critical">
                            <div class="alert-title">🔴 ${overdueTasks.length} OVERDUE TASK(S)</div>
                            <ul class="task-list">
                                ${overdueTasks.map(t => this.renderTaskItem(t)).join('')}
                            </ul>
                            <p style="margin-top: 10px; color: #ff4336; font-size: 12px;">
                                ESCALATION REQUIRED: These tasks must be completed or explicitly blocked with a reason.
                            </p>
                        </div>
                    ` : `
                        <div class="alert-section success">
                            <div class="alert-title">✓ No Overdue Tasks</div>
                            <p>You're on track. Keep it up.</p>
                        </div>
                    `}
                </div>

                <div class="dashboard-card">
                    <h3>⏸️ Blocked Tasks</h3>
                    ${blockedTasks.length > 0 ? `
                        <div class="alert-section warning">
                            <div class="alert-title">⏸️ ${blockedTasks.length} BLOCKED TASK(S)</div>
                            <ul class="task-list">
                                ${blockedTasks.map(t => `
                                    <div class="task-item blocked">
                                        <div class="task-info">
                                            <div class="task-title">${t.title}</div>
                                            <div class="task-meta">
                                                Blocked by: ${t.blocked_reason || 'Unknown'}
                                                <br/>Unblock date: ${new Date(t.unblock_date).toLocaleDateString()}
                                            </div>
                                        </div>
                                    </div>
                                `).join('')}
                            </ul>
                        </div>
                    ` : `
                        <div class="alert-section success">
                            <div class="alert-title">✓ No Blocked Tasks</div>
                            <p>Clear to work. No obstacles.</p>
                        </div>
                    `}
                </div>

                <div class="dashboard-card">
                    <h3>📋 Today's Tasks</h3>
                    ${todayTasks.length > 0 ? `
                        <div class="alert-section">
                            <ul class="task-list">
                                ${todayTasks.map(t => this.renderTaskItem(t)).join('')}
                            </ul>
                        </div>
                    ` : `
                        <div class="alert-section success">
                            <div class="alert-title">✓ No Tasks Due Today</div>
                            <p>Check upcoming tasks.</p>
                        </div>
                    `}
                </div>

                <div class="dashboard-card">
                    <h3>⚙️ In Progress</h3>
                    ${inProgressTasks.length > 0 ? `
                        <div class="alert-section">
                            <ul class="task-list">
                                ${inProgressTasks.slice(0, 5).map(t => this.renderTaskItem(t)).join('')}
                            </ul>
                            ${inProgressTasks.length > 5 ? `<p style="margin-top: 10px; color: #ffb74d;">+ ${inProgressTasks.length - 5} more in progress</p>` : ''}
                        </div>
                    ` : `
                        <div class="alert-section success">
                            <div class="alert-title">✓ No In-Progress Tasks</div>
                            <p>Start working on something.</p>
                        </div>
                    `}
                </div>
            </div>
        `;
    }

    renderTaskItem(task) {
        const daysOverdue = task.overdue ? Math.floor((Date.now() - new Date(task.due_date)) / (1000 * 60 * 60 * 24)) : 0;
        
        return `
            <div class="task-item ${task.status === 'blocked' ? 'blocked' : task.overdue ? 'overdue' : task.priority}">
                <div class="task-info">
                    <div class="task-title">${task.title}</div>
                    <div class="task-meta">
                        Due: ${new Date(task.due_date).toLocaleDateString()} 
                        ${task.overdue ? `| <strong style="color: #ff4336;">${daysOverdue} days overdue</strong>` : ''}
                        | Est: ${task.estimated_hours}h | Actual: ${task.actual_hours || 0}h
                    </div>
                </div>
                <span class="task-status ${task.status.replace('_', '-')}">${task.status}</span>
            </div>
        `;
    }

    renderAllTasks() {
        return `
            <h2 style="margin-bottom: 20px; color: #2196f3;">All Tasks (${this.tasks.length})</h2>
            <div style="display: flex; gap: 10px; margin-bottom: 20px;">
                <button class="btn btn-primary" onclick="app.filterTasks('all')">All</button>
                <button class="btn btn-primary" onclick="app.filterTasks('overdue')">Overdue</button>
                <button class="btn btn-warning" onclick="app.filterTasks('blocked')">Blocked</button>
                <button class="btn btn-success" onclick="app.filterTasks('complete')">Complete</button>
            </div>
            <ul class="task-list">
                ${this.tasks.map(t => this.renderTaskItem(t)).join('')}
            </ul>
        `;
    }

    renderCreateTask() {
        return `
            <div class="alert-section critical" style="margin-bottom: 20px;">
                <div class="alert-title">📋 Task Creation (STRICT REQUIREMENTS)</div>
                <p>All fields marked with <span class="form-required">*</span> are required. No escape hatches.</p>
            </div>
            <form id="createTaskForm" style="background: #16213e; padding: 20px; border-radius: 8px;">
                <div class="form-group">
                    <label>Task Title <span class="form-required">*</span></label>
                    <input type="text" id="taskTitle" required placeholder="Be specific. What is this task?">
                </div>

                <div class="form-group">
                    <label>Description</label>
                    <textarea id="taskDescription" placeholder="Additional context or notes..."></textarea>
                </div>

                <div class="form-group">
                    <label>Due Date <span class="form-required">*</span></label>
                    <input type="date" id="taskDueDate" required>
                </div>

                <div class="form-group">
                    <label>Priority <span class="form-required">*</span></label>
                    <select id="taskPriority" required>
                        <option value="">-- Select Priority --</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical (only 1 allowed)</option>
                    </select>
                </div>

                <div class="form-group">
                    <label>Estimated Hours <span class="form-required">*</span></label>
                    <input type="number" id="taskEstimate" step="0.5" min="0.5" required placeholder="How many hours?">
                </div>

                <div class="form-group">
                    <label>Success Criteria <span class="form-required">*</span></label>
                    <textarea id="taskCriteria" required placeholder="How will you know this is done? Define completion clearly."></textarea>
                </div>

                <div class="form-group">
                    <label>Owner</label>
                    <input type="text" id="taskOwner" placeholder="Default: You" value="twiney-001">
                </div>

                <div class="modal-buttons">
                    <button type="submit" class="btn btn-success">Create Task</button>
                    <button type="reset" class="btn btn-warning">Clear</button>
                </div>
            </form>
        `;
    }

    renderTimeLog() {
        const inProgressTasks = this.tasks.filter(t => t.status === 'in_progress');
        
        return `
            <h2 style="margin-bottom: 20px; color: #2196f3;">Log Time</h2>
            <form id="timeLogForm" style="background: #16213e; padding: 20px; border-radius: 8px;">
                <div class="form-group">
                    <label>Select Task</label>
                    <select id="timeLogTask" required>
                        <option value="">-- Select Task --</option>
                        ${inProgressTasks.map(t => `<option value="${t.id}">${t.title}</option>`).join('')}
                    </select>
                </div>

                <div class="form-group">
                    <label>Hours Spent</label>
                    <input type="number" id="timeLogHours" step="0.25" min="0.25" required placeholder="How many hours?">
                </div>

                <div class="form-group">
                    <label>Notes</label>
                    <textarea id="timeLogNotes" placeholder="What did you work on? What was accomplished?"></textarea>
                </div>

                <div class="modal-buttons">
                    <button type="submit" class="btn btn-success">Log Time</button>
                </div>
            </form>
        `;
    }

    renderAccountability() {
        return `
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">
                <div style="background: #0f3460; border: 1px solid #16213e; border-radius: 8px; padding: 20px;">
                    <h3 style="color: #2196f3; margin-bottom: 15px;">📍 Morning Check-In</h3>
                    <p style="margin-bottom: 15px; font-size: 14px;">What tasks are you working on today?</p>
                    <button class="btn btn-primary btn-small" onclick="app.morningCheckIn()">Start Check-In</button>
                </div>

                <div style="background: #0f3460; border: 1px solid #16213e; border-radius: 8px; padding: 20px;">
                    <h3 style="color: #2196f3; margin-bottom: 15px;">📊 Evening Check-Out</h3>
                    <p style="margin-bottom: 15px; font-size: 14px;">What did you complete today?</p>
                    <button class="btn btn-primary btn-small" onclick="app.eveningCheckOut()">End of Day Report</button>
                </div>

                <div style="background: #0f3460; border: 1px solid #16213e; border-radius: 8px; padding: 20px;">
                    <h3 style="color: #2196f3; margin-bottom: 15px;">📈 Weekly Report</h3>
                    <p style="margin-bottom: 15px; font-size: 14px;">Performance and feedback for this week</p>
                    <button class="btn btn-primary btn-small" onclick="app.weeklyReport()">Generate Report</button>
                </div>

                <div style="background: #0f3460; border: 1px solid #16213e; border-radius: 8px; padding: 20px;">
                    <h3 style="color: #2196f3; margin-bottom: 15px;">📉 Trend Analysis</h3>
                    <p style="margin-bottom: 15px; font-size: 14px;">Monthly performance trends</p>
                    <button class="btn btn-primary btn-small" onclick="app.trendAnalysis()">View Trends</button>
                </div>
            </div>
        `;
    }

    isToday(dateString) {
        return new Date(dateString).toDateString() === new Date().toDateString();
    }

    filterTasks(filter) {
        // Filter logic here
        alert(`Filtering: ${filter}`);
    }

    morningCheckIn() {
        alert('Morning check-in: List your tasks for today');
    }

    eveningCheckOut() {
        alert('Evening check-out: Report what you completed');
    }

    weeklyReport() {
        alert('Generating weekly accountability report...');
    }

    trendAnalysis() {
        alert('Analyzing monthly trends...');
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ExecutosApp();
});

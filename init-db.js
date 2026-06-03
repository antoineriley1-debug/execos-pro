/**
 * Initialize Database for EXECOS Pro
 * Creates schema and seed data
 */

const db = require('./db');
const { v4: uuidv4 } = require('uuid');

async function initializeDatabase() {
  try {
    console.log('🚀 Initializing EXECOS Pro Database...');
    
    // Initialize database (runs schema)
    await db.initialize();
    
    // Seed a default user
    const userId = 'twiney-001';
    const now = new Date().toISOString();
    
    await db.run(
      `INSERT OR IGNORE INTO users (id, name, email, timezone, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, 'Twiney', 'twiney@execos.pro', 'America/New_York', now, now]
    );
    
    console.log('✅ User created: twiney-001');
    
    // Create sample tasks to demonstrate system
    const sampleTasks = [
      {
        title: 'Weekly Strategy Review',
        description: 'Review PS60 trading performance and plan next week',
        due_date: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        priority: 'high',
        estimated_hours: 2,
        success_criteria: 'Review weekly stats, identify patterns, plan next week trades'
      },
      {
        title: 'Contract Review - Vendor XYZ',
        description: 'Review and approve new vendor agreement',
        due_date: new Date(Date.now() + 172800000).toISOString(), // 2 days
        priority: 'critical',
        estimated_hours: 3,
        success_criteria: 'Contract reviewed, feedback provided, decision made (approve/reject)'
      },
      {
        title: 'Update Portfolio Analysis',
        description: 'Update supply/demand zones for TSLA, AAPL, AMZN',
        due_date: new Date(Date.now() + 259200000).toISOString(), // 3 days
        priority: 'medium',
        estimated_hours: 1.5,
        success_criteria: 'All zones updated, measured potential calculated, notes added'
      }
    ];
    
    for (const task of sampleTasks) {
      const taskId = uuidv4();
      await db.run(
        `INSERT INTO tasks (
          id, user_id, title, description, due_date, priority, owner_id,
          estimated_hours, success_criteria, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          taskId, userId, task.title, task.description, task.due_date,
          task.priority, userId, task.estimated_hours, task.success_criteria,
          now, now
        ]
      );
    }
    
    console.log('✅ Sample tasks created');
    
    console.log('\n✨ Database initialization complete!');
    console.log('📦 Schema created');
    console.log('👤 User seeded: twiney-001');
    console.log('📋 Sample tasks added');
    console.log('\n🚀 Ready to start the server with: npm start');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();

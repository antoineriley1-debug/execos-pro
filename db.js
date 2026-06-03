const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'execos-pro.db');
let db = null;

const initialize = () => {
  return new Promise((resolve, reject) => {
    db = new sqlite3.Database(DB_PATH, (err) => {
      if (err) {
        reject(err);
      } else {
        // Enable foreign keys
        db.run('PRAGMA foreign_keys = ON', (err) => {
          if (err) {
            reject(err);
          } else {
            // Load schema
            const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
            const statements = schema.split(';').filter(s => s.trim());
            
            let completed = 0;
            let hasError = false;

            statements.forEach((statement, index) => {
              db.run(statement + ';', (err) => {
                if (err && !hasError) {
                  hasError = true;
                  reject(err);
                  return;
                }
                
                completed++;
                if (completed === statements.length && !hasError) {
                  console.log('✅ Database initialized');
                  resolve();
                }
              });
            });

            if (statements.length === 0) {
              resolve();
            }
          }
        });
      }
    });
  });
};

const run = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve({ id: this.lastID, changes: this.changes });
    });
  });
};

const get = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const all = (query, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(query, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows || []);
    });
  });
};

const close = () => {
  return new Promise((resolve, reject) => {
    if (db) {
      db.close((err) => {
        if (err) reject(err);
        else resolve();
      });
    } else {
      resolve();
    }
  });
};

module.exports = {
  initialize,
  run,
  get,
  all,
  close
};

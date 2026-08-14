import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'analytics.db');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
  }
});

// Helper functions returning Promises
export const queryAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

export const queryGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

export const queryRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
};

export const initDb = async () => {
  await queryRun(`
    CREATE TABLE IF NOT EXISTS sessions (
      session_id TEXT PRIMARY KEY,
      ip TEXT,
      city TEXT,
      state TEXT,
      country TEXT,
      country_code TEXT,
      org TEXT,
      isp TEXT,
      device_type TEXT,
      os TEXT,
      browser TEXT,
      screen_res TEXT,
      referrer TEXT,
      entry_page TEXT,
      start_time DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_ping DATETIME DEFAULT CURRENT_TIMESTAMP,
      duration_seconds INTEGER DEFAULT 0
    )
  `);

  await queryRun(`
    CREATE TABLE IF NOT EXISTS clicks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      link_url TEXT,
      link_text TEXT,
      link_type TEXT,
      section TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(session_id) REFERENCES sessions(session_id)
    )
  `);

  console.log('Database tables initialized.');
};

export default db;

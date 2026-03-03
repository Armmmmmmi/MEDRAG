import Database from 'better-sqlite3';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_PATH = path.join(__dirname, '..', '..', 'data', 'medrag.db');

let db: Database.Database;

export function getDb(): Database.Database {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS interaction_records (
      id TEXT PRIMARY KEY,
      drugA TEXT NOT NULL,
      drugB TEXT NOT NULL,
      significance TEXT,
      onset TEXT,
      severity TEXT,
      documentation TEXT,
      effect TEXT,
      mechanism TEXT,
      management TEXT,
      ddisscuss TEXT,
      dbiblio TEXT,
      reference TEXT,
      source TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_interaction_drugs
    ON interaction_records (drugA, drugB);
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS admin_users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS query_history (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      query_type TEXT NOT NULL,
      query_input TEXT NOT NULL,
      query_result TEXT NOT NULL,
      similarity_score REAL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_query_history_date
    ON query_history (created_at DESC);
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_query_history_type
    ON query_history (query_type);
  `);

  // Insert default settings if not exists
  const insertSetting = db.prepare(`
    INSERT OR IGNORE INTO app_settings (key, value) VALUES (?, ?)
  `);

  insertSetting.run('embedding_url', 'http://localhost:11434');
  insertSetting.run('embedding_model', 'qwen3-embedding:4b');
  insertSetting.run('generation_url', 'http://localhost:11434');
  insertSetting.run('generation_model', 'MedAIBase/MedGemma1.5:4b');
  insertSetting.run('qdrant_url', 'http://localhost:6333');
  insertSetting.run('qdrant_collection', 'ddi_vectors');
  insertSetting.run('patient_query_template', "SELECT drug_name FROM opitemrece WHERE hn = '{HN}' AND vstdate = '{DATE}'");
  insertSetting.run('bridge_server_url', 'http://localhost:3001');

  // Create default admin user if not exists
  const adminUser = db.prepare('SELECT id FROM admin_users WHERE username = ?').get('admin');
  if (!adminUser) {
    const hash = bcrypt.hashSync('admin1234', 10);
    db.prepare('INSERT INTO admin_users (username, password_hash) VALUES (?, ?)').run('admin', hash);
  }
}

export function getSetting(key: string): string | undefined {
  const db = getDb();
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined;
  return row?.value;
}

export function setSetting(key: string, value: string): void {
  const db = getDb();
  db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value);
}

export function closeDb(): void {
  if (db) {
    db.close();
  }
}

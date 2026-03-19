import Database from 'better-sqlite3';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_DIR = join(__dirname, '..', 'data');

if (!existsSync(DATA_DIR)) {
  mkdirSync(DATA_DIR, { recursive: true });
}

const db = new Database(join(DATA_DIR, 'mongo-vista.db'));

// Enable WAL mode for better concurrent performance
db.pragma('journal_mode = WAL');

// ─── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS connections (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    name        TEXT    NOT NULL,
    uri         TEXT    NOT NULL,
    created_at  TEXT    NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS query_history (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    connection_id   INTEGER NOT NULL,
    database_name   TEXT,
    collection_name TEXT,
    query           TEXT    NOT NULL,
    executed_at     TEXT    NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (connection_id) REFERENCES connections(id) ON DELETE CASCADE
  );
`);

// ─── Prepared Statements ───────────────────────────────────────────────────────

const stmts = {
  insertConnection:   db.prepare('INSERT INTO connections (name, uri) VALUES (?, ?)'),
  getConnections:     db.prepare('SELECT * FROM connections ORDER BY created_at DESC'),
  getConnectionById:  db.prepare('SELECT * FROM connections WHERE id = ?'),
  deleteConnection:   db.prepare('DELETE FROM connections WHERE id = ?'),
  updateConnection:   db.prepare('UPDATE connections SET name = ?, uri = ? WHERE id = ?'),

  insertHistory:      db.prepare(
    'INSERT INTO query_history (connection_id, database_name, collection_name, query) VALUES (?, ?, ?, ?)'
  ),
  getHistory:         db.prepare(
    'SELECT * FROM query_history WHERE connection_id = ? ORDER BY executed_at DESC LIMIT ?'
  ),
  deleteHistoryByConn: db.prepare('DELETE FROM query_history WHERE connection_id = ?'),
};

// ─── Public API ────────────────────────────────────────────────────────────────

export function saveConnection(name, uri) {
  const info = stmts.insertConnection.run(name, uri);
  return { id: info.lastInsertRowid, name, uri };
}

export function getConnections() {
  return stmts.getConnections.all();
}

export function getConnectionById(id) {
  return stmts.getConnectionById.get(id);
}

export function deleteConnection(id) {
  stmts.deleteHistoryByConn.run(id);
  stmts.deleteConnection.run(id);
}

export function updateConnection(id, name, uri) {
  stmts.updateConnection.run(name, uri, id);
  return { id, name, uri };
}

export function addQueryHistory(connectionId, dbName, collectionName, query) {
  const info = stmts.insertHistory.run(connectionId, dbName, collectionName, query);
  return { id: info.lastInsertRowid };
}

export function getQueryHistory(connectionId, limit = 50) {
  return stmts.getHistory.all(connectionId, limit);
}

export default db;

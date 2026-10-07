import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

export function openDatabase(path) {
  const db = new DatabaseSync(path);
  db.exec(`PRAGMA journal_mode=WAL;
    CREATE TABLE IF NOT EXISTS config (id INTEGER PRIMARY KEY CHECK(id=1), json TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS todos (
      id INTEGER PRIMARY KEY, public_id TEXT UNIQUE NOT NULL, title TEXT NOT NULL,
      completed INTEGER NOT NULL DEFAULT 0, priority TEXT NOT NULL, project TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS requests (
      request_id TEXT PRIMARY KEY, run_id TEXT NOT NULL, at TEXT NOT NULL, method TEXT NOT NULL,
      route TEXT NOT NULL, platform TEXT, body TEXT, status INTEGER, evidence TEXT);
  `);
  if (!db.prepare('SELECT id FROM config').get()) resetDatabase(db);
  return db;
}
export function config(db) {
  return JSON.parse(db.prepare('SELECT json FROM config WHERE id=1').get().json);
}
export function resetDatabase(db, count = 120) {
  if (!Number.isInteger(count) || count < 8 || count > 300) throw new Error('count must be 8–300');
  const next = { app: 'debug-cli-challenge', revision: 'todo-demo-v1', runId: randomUUID(), mode: 'challenge', count };
  const titles = ['Send the launch checklist', 'Review the iOS build', 'Book the rehearsal room', 'Record the product walkthrough', 'Check the release notes', 'Share the design review', 'Pack the demo cable', 'Write the follow-up'];
  db.exec('BEGIN IMMEDIATE');
  try {
    db.exec('DELETE FROM todos; DELETE FROM requests; DELETE FROM config;');
    db.prepare('INSERT INTO config VALUES (1, ?)').run(JSON.stringify(next));
    const insert = db.prepare('INSERT INTO todos VALUES (?, ?, ?, 0, ?, ?)');
    for (let i = 1; i <= count; i++) insert.run(i, `task-${String(i).padStart(3, '0')}`, `${titles[(i - 1) % titles.length]}${i > 8 ? ` · ${i}` : ''}`, i % 4 === 1 ? 'high' : 'normal', ['Launch', 'Product', 'Personal'][(i - 1) % 3]);
    db.exec('COMMIT');
  } catch (error) { db.exec('ROLLBACK'); throw error; }
  return next;
}
export function publicTodo(row) {
  return { id: row.public_id, title: row.title, completed: Boolean(row.completed), priority: row.priority, project: row.project };
}

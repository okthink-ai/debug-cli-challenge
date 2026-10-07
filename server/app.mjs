import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { config, publicTodo, resetDatabase } from './database.mjs';

export function createApp(db) {
  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    const allowed =
      !origin ||
      /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin) ||
      origin === process.env.DEMO_WEB_ORIGIN;
    if (!allowed) {
      res.writeHead(403).end();
      return;
    }
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'Content-Type, X-Request-ID, X-Platform, X-Demo-Control',
    );
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PATCH, OPTIONS');
    if (req.method === 'OPTIONS') {
      res.writeHead(204).end();
      return;
    }
    const url = new URL(req.url, 'http://localhost');
    const requestId = String(req.headers['x-request-id'] || randomUUID());
    const reply = (status, data) => {
      res.writeHead(status, { 'Content-Type': 'application/json', 'X-Request-ID': requestId });
      res.end(JSON.stringify(data));
    };
    let body = {};
    try {
      let text = '';
      for await (const chunk of req) {
        text += chunk;
        if (text.length > 16384) {
          reply(413, { error: 'Body too large', requestId });
          return;
        }
      }
      if (text) body = JSON.parse(text);
    } catch {
      reply(400, { error: 'Invalid JSON', requestId });
      return;
    }
    if (body === null || typeof body !== 'object' || Array.isArray(body)) {
      reply(400, { error: 'Expected a JSON object', requestId });
      return;
    }
    if (url.pathname === '/health') {
      reply(200, config(db));
      return;
    }
    if (url.pathname === '/config') {
      reply(200, { ...config(db), capabilities: { revision: 2, priorities: ['normal', 'high'] } });
      return;
    }
    if (url.pathname === '/__demo/reset' && req.method === 'POST') {
      if (req.headers['x-demo-control'] !== '1') {
        reply(403, { error: 'Explicit demo control header required' });
        return;
      }
      try {
        reply(200, resetDatabase(db, body.count ?? 120));
      } catch (error) {
        reply(400, { error: error.message });
      }
      return;
    }
    if (url.pathname === '/__demo/requests' && req.method === 'GET') {
      const rows = db.prepare('SELECT * FROM requests ORDER BY rowid DESC LIMIT 40').all();
      reply(
        200,
        rows.map((row) => ({
          ...row,
          body: JSON.parse(row.body),
          evidence: JSON.parse(row.evidence),
        })),
      );
      return;
    }
    const cfg = config(db);
    const record = (status, evidence, data) => {
      db.prepare('INSERT OR REPLACE INTO requests VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)').run(
        requestId,
        cfg.runId,
        new Date().toISOString(),
        req.method,
        url.pathname,
        String(req.headers['x-platform'] || 'unknown'),
        JSON.stringify(body),
        status,
        JSON.stringify(evidence),
      );
      reply(status, { ...data, requestId, runId: cfg.runId });
    };
    try {
      if (url.pathname === '/todos' && req.method === 'GET') {
        record(
          200,
          { sql: 'SELECT * FROM todos ORDER BY id' },
          { todos: db.prepare('SELECT * FROM todos ORDER BY id').all().map(publicTodo) },
        );
        return;
      }
      if (url.pathname === '/todos' && req.method === 'POST') {
        if (typeof body.title !== 'string' || !body.title.trim() || body.title.length > 200) {
          record(400, { error: 'INVALID_TITLE' }, { error: 'Enter a title of 1–200 characters' });
          return;
        }
        if (!['normal', 'high'].includes(body.priority)) {
          record(
            422,
            {
              error: 'UNSUPPORTED_PRIORITY',
              supported: ['normal', 'high'],
              received: body.priority,
              rowsAffected: 0,
            },
            { error: `Priority “${body.priority}” is not supported`, code: 'UNSUPPORTED_PRIORITY' },
          );
          return;
        }
        const id = `task-${randomUUID().slice(0, 8)}`;
        db.prepare(
          'INSERT INTO todos (public_id, title, priority, project) VALUES (?, ?, ?, ?)',
        ).run(id, body.title.trim(), body.priority, 'Launch');
        const row = db.prepare('SELECT * FROM todos WHERE public_id=?').get(id);
        record(201, { rowsAffected: 1, after: row }, { todo: publicTodo(row) });
        return;
      }
      const match = url.pathname.match(/^\/todos\/(task-[\w-]+)$/);
      if (match && req.method === 'PATCH') {
        const before = db.prepare('SELECT * FROM todos WHERE public_id=?').get(match[1]);
        if (!before) {
          record(404, {}, { error: 'Todo not found' });
          return;
        }
        if (typeof body.completed !== 'boolean') {
          record(400, {}, { error: 'completed must be boolean' });
          return;
        }
        const sql = 'UPDATE todos SET completed=? WHERE id=?';
        const params = [Number(body.completed), match[1]];
        const result = db.prepare(sql).run(...params);
        const after = db.prepare('SELECT * FROM todos WHERE public_id=?').get(match[1]);
        const todo = { ...publicTodo(before), completed: body.completed };
        record(
          200,
          { sql, params, rowsAffected: result.changes, before, after, response: todo },
          { todo },
        );
        return;
      }
      reply(404, { error: 'Route not found', requestId });
    } catch (error) {
      record(500, { error: error.message }, { error: 'Local server failed' });
    }
  });
}

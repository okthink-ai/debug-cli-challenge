import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { openDatabase } from '../server/database.mjs';
import { createApp } from '../server/app.mjs';

test('local API: seed, capabilities, create, validation, and explicit reset', async () => {
  const db = openDatabase(':memory:');
  const server = createApp(db).listen(0, '127.0.0.1');
  await once(server, 'listening');
  const base = `http://127.0.0.1:${server.address().port}`;
  const request = (path, body, control = false) => fetch(base + path, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json', ...(control ? { 'X-Demo-Control': '1' } : {}) }, body: JSON.stringify(body),
  });
  try {
    const initial = await (await request('/todos')).json();
    assert.equal(initial.todos.length, 120);
    const config = await (await request('/config')).json();
    assert.deepEqual(config.capabilities.priorities, ['normal', 'high']);
    const added = await request('/todos', { title: 'Rehearse', priority: 'high' });
    assert.equal(added.status, 201);
    const { todo } = await added.json();
    assert.equal(db.prepare('SELECT title FROM todos WHERE public_id=?').get(todo.id).title, 'Rehearse');
    assert.equal((await request('/todos', { title: '', priority: 'high' })).status, 400);
    assert.equal((await request('/todos', { title: 'Rehearse', priority: 'unsupported' })).status, 422);
    assert.equal((await request('/__demo/reset', {})).status, 403);
    assert.equal((await request('/__demo/reset', { count: 0 }, true)).status, 400);
    const reset = await (await request('/__demo/reset', { count: 120 }, true)).json();
    assert.notEqual(reset.runId, config.runId);
    assert.equal(db.prepare('SELECT count(*) AS n FROM todos').get().n, 120);
  } finally { await new Promise(resolve => server.close(resolve)); db.close(); }
});

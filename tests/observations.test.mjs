import test from 'node:test';
import assert from 'node:assert/strict';
import { summarizeState } from '../src/observations.js';
import { compactResult } from '../debug-cli/output.mjs';

const snapshot = () => ({
  app: 'debug-cli-challenge',
  platform: 'web',
  instanceId: 'web-1',
  runId: 'fixture-1',
  apiBase: 'http://127.0.0.1:4310',
  revision: 'v1',
  observedAt: '2026-10-07T00:00:00Z',
  state: {
    config: { runId: 'fixture-1' },
    loading: false,
    priority: 'high',
    capabilityRevision: 2,
    draft: '',
    pending: false,
    notice: '',
    error: null,
    todos: Array.from({ length: 120 }, (_, i) => ({
      id: `task-${i}`,
      completed: i < 3,
      title: 'Task',
    })),
    requests: [
      {
        requestId: 'r1',
        at: 'now',
        method: 'GET',
        route: '/todos',
        status: 200,
        response: {
          todos: Array.from({ length: 120 }, () => ({ title: 'Large historical response' })),
        },
      },
    ],
  },
});

test('focused state keeps runtime identity and exact counts without duplicating request bodies', () => {
  const summary = summarizeState(snapshot());
  assert.deepEqual(summary.tasks, { total: 120, completed: 3 });
  assert.equal(summary.runId, 'fixture-1');
  assert.equal(summary.latestRequest.requestId, 'r1');
  assert.equal(summary.latestRequest.response, undefined);
  assert.ok(JSON.stringify(summary).length < 1500);
});

test('task selection uses live values and marks missing or uninitialized evidence unknown', () => {
  assert.equal(summarizeState(snapshot(), 'task-2').task.completed, true);
  assert.equal(summarizeState(snapshot(), 'missing').status, 'unknown');
  const loading = snapshot();
  loading.state.loading = true;
  assert.equal(summarizeState(loading).status, 'unknown');
});

test('compact trace keeps known failures and missing observers together', () => {
  const result = compactResult('trace', {
    status: 'fail',
    requestId: 'r1',
    backend: { status: 200, evidence: { rowsAffected: 0 } },
    failures: ['zero rows updated'],
    missing: ['native runtime'],
  });
  assert.equal(result.status, 'fail');
  assert.equal(result.result.rowsAffected, 0);
  assert.deepEqual(result.failures, ['zero rows updated']);
  assert.deepEqual(result.missing, ['native runtime']);
});

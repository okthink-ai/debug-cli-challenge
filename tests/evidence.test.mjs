import test from 'node:test';
import assert from 'node:assert/strict';
import { compare, assessTrace } from '../debug-cli/evidence.mjs';
const snap = (platform, priority = 'high', revision = 2) => ({ platform, runId: 'run-1', state: { priority, capabilityRevision: revision } });
test('compare distinguishes disagreement, agreement, missing and stale observations', () => {
  assert.equal(compare(snap('web'), snap('ios', 'urgent', 1)).status, 'fail');
  assert.equal(compare(snap('web'), snap('ios')).status, 'pass');
  assert.equal(compare(snap('web'), null).status, 'unknown');
  assert.equal(compare(snap('web'), { ...snap('ios'), runId: 'other' }).status, 'unknown');
});
test('trace preserves failures when another observer disappears', () => {
  assert.equal(assessTrace({ status: 422 }, null, null).status, 'fail');
  assert.equal(assessTrace(null, { method: 'PATCH', status: 200, evidence: { rowsAffected: 0 } }, null).status, 'fail');
  assert.equal(assessTrace(null, null, null).status, 'unknown');
});
test('trace detects persisted disagreement after HTTP success', () => {
  const client = { status: 200, body: { completed: true } };
  const server = { method: 'PATCH', status: 200, evidence: { rowsAffected: 1 } };
  assert.equal(assessTrace(client, server, { completed: 0 }).status, 'fail');
  assert.equal(assessTrace(client, server, { completed: 1 }).status, 'pass');
  assert.equal(assessTrace(client, server, null).status, 'unknown');
});
test('an in-flight client result stays unknown; created row contents must match', () => {
  assert.equal(assessTrace({ status: null }, { status: 200 }, null).status, 'unknown');
  const client = { status: 201, body: { title: 'Call the venue', priority: 'high' } };
  const server = { method: 'POST', status: 201 };
  assert.equal(assessTrace(client, server, { title: 'Something else', priority: 'high' }).status, 'fail');
  assert.equal(assessTrace(client, server, { title: 'Call the venue', priority: 'high' }).status, 'pass');
});

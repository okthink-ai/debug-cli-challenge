// Checks the shipped broken state. This intentionally stops passing after repairs.
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';
const cli = (...args) => {
  try {
    return JSON.parse(
      execFileSync(process.execPath, ['debug-cli/cli.mjs', ...args], { encoding: 'utf8' }),
    );
  } catch (error) {
    if ([1, 2].includes(error.status)) return JSON.parse(error.stdout);
    throw error;
  }
};
const browser = await chromium.connectOverCDP(process.env.DEMO_CDP || 'http://127.0.0.1:9337');
const page = browser
  .contexts()
  .flatMap((context) => context.pages())
  .find((page) =>
    ['http://localhost:8087', 'http://127.0.0.1:8087'].some((base) => page.url().startsWith(base)),
  );
try {
  assert.ok(page, 'Run npm run debug -- browser first');
  const cfg = cli('reset');
  await page.reload();
  await page.waitForFunction(
    (runId) =>
      globalThis.__TODO_DEBUG__?.snapshot().runId === runId &&
      !globalThis.__TODO_DEBUG__.snapshot().state.loading,
    cfg.runId,
  );
  assert.equal(cli('doctor').status, 'pass');
  await page.getByTestId('toggle-task-001').click();
  await page.waitForFunction(
    () => globalThis.__TODO_DEBUG__.snapshot().state.notice === 'Completed · saved',
  );
  const trace = cli('trace', 'last', '--full', '--out', 'artifacts/stack-before.json');
  assert.equal(trace.status, 'fail');
  assert.equal(trace.backend.evidence.rowsAffected, 0);
  assert.equal(trace.database.completed, 0);
  await page.getByTestId('refresh').click();
  await page.waitForFunction(() => !globalThis.__TODO_DEBUG__.snapshot().state.todos[0].completed);
  assert.equal(await page.getByTestId('toggle-task-001').getAttribute('aria-checked'), 'false');
  const perf = cli('perf-type', 'Rehearse', '--out', 'artifacts/perf-web-before.json.gz');
  assert.equal(perf.react.rowCommits, 120 * 8);
  await page.getByTestId('add').click();
  await page.waitForFunction(
    () => globalThis.__TODO_DEBUG__.snapshot().state.notice === 'Added to your list',
  );
  assert.equal(
    cli('trace', 'last', '--full', '--out', 'artifacts/web-add-before.json').status,
    'pass',
  );
  console.log(
    'PASS: shipped web symptoms reproduced via real input; joined persistence failure, 960 row commits, working web add. iOS is a separate check.',
  );
} finally {
  await browser.close();
}

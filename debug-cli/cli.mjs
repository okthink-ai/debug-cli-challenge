import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawn } from 'node:child_process';
import { DatabaseSync } from 'node:sqlite';
import { gzipSync } from 'node:zlib';
import { observe, target } from './cdp.mjs';
import { compare, assessTrace } from './evidence.mjs';
import { help } from './help.mjs';
import { compactResult } from './output.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const args = process.argv.slice(2);
const command = args[0] || 'help';
const option = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};
const platform = option('target', 'web');
const api = process.env.DEMO_API_URL || 'http://127.0.0.1:4310';
async function backend(path = '/health', options) {
  const response = await fetch(`${api}${path}`, { ...options, signal: AbortSignal.timeout(5000) });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}
function database(id) {
  const db = new DatabaseSync(resolve(process.env.DEMO_DB || `${root}/.data/todos.sqlite`), {
    readOnly: true,
  });
  try {
    return {
      config: JSON.parse(db.prepare('SELECT json FROM config WHERE id=1').get().json),
      rows: id
        ? db.prepare('SELECT * FROM todos WHERE public_id=?').all(id)
        : db.prepare('SELECT * FROM todos ORDER BY id LIMIT 12').all(),
    };
  } finally {
    db.close();
  }
}
async function webPage() {
  const { chromium } = await import('playwright');
  const browser = await chromium.connectOverCDP(process.env.DEMO_CDP || 'http://127.0.0.1:9337');
  const pages = browser.contexts().flatMap((context) => context.pages());
  const matching = [];
  for (const page of pages) {
    try {
      if (
        await page.evaluate(
          () => globalThis.__TODO_DEBUG__?.snapshot().app === 'debug-cli-challenge',
        )
      )
        matching.push(page);
    } catch {
      /* another tab */
    }
  }
  if (matching.length !== 1) {
    await browser.close();
    throw new Error('Expected exactly one Debug CLI Challenge web tab');
  }
  return { browser, page: matching[0] };
}
async function prepareCapture(platform) {
  await observe(platform, `globalThis.__TODO_DEBUG__.setFlash(${args.includes('--flash')})`);
  // Changing the UI switch commits rows. Exclude that setup and previous animations.
  await new Promise((resolve) => setTimeout(resolve, 800));
}
async function run() {
  if (command === 'help' || command === '--help') {
    console.log(help(args[1]));
    return;
  }
  if (command === 'browser') {
    const chrome =
      process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    const child = spawn(
      chrome,
      [
        '--remote-debugging-port=9337',
        `--user-data-dir=${root}/.data/chrome`,
        '--no-first-run',
        '--no-default-browser-check',
        'http://localhost:8087',
      ],
      { detached: true, stdio: 'ignore' },
    );
    await new Promise((resolve, reject) => {
      child.once('spawn', resolve);
      child.once('error', reject);
    });
    child.unref();
    return { launched: true, pid: child.pid, endpoint: 'http://127.0.0.1:9337' };
  }
  if (command === 'reset') {
    if (args[1] && !args[1].startsWith('--'))
      throw new Error('reset accepts --count only; there are no repair modes');
    return backend('/__demo/reset', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Demo-Control': '1' },
      body: JSON.stringify({ count: Number(option('count', 120)) }),
    });
  }
  if (command === 'state') {
    const taskId = option('task');
    if (taskId && args.includes('--full'))
      throw new Error('Choose --task for a focused query or --full for the whole snapshot');
    if (args.includes('--full') || option('out')) return observe(platform);
    return observe(platform, `globalThis.__TODO_DEBUG__.state(${JSON.stringify(taskId)})`);
  }
  if (command === 'reload')
    return observe(
      platform,
      '(globalThis.__TODO_DEBUG__.actions.initialize(), { scheduled: true, mechanism: "application action, not UI input" })',
    );
  if (command === 'requests') return (await observe(platform)).state.requests;
  if (command === 'server')
    return { identity: await backend(), requests: await backend('/__demo/requests') };
  if (command === 'database') return database(args[1]);
  if (command === 'compare') {
    const [web, ios] = await Promise.allSettled([observe('web'), observe('ios')]);
    return {
      ...compare(
        web.status === 'fulfilled' ? web.value : null,
        ios.status === 'fulfilled' ? ios.value : null,
      ),
      errors: [web, ios]
        .filter((item) => item.status === 'rejected')
        .map((item) => item.reason.message),
    };
  }
  if (command === 'doctor') {
    const [runtime, server] = await Promise.allSettled([
      observe(platform, 'globalThis.__TODO_DEBUG__.identity()'),
      backend(),
    ]);
    const app = runtime.status === 'fulfilled' ? runtime.value : null;
    const identity = server.status === 'fulfilled' ? server.value : null;
    return {
      status:
        app?.runId && identity?.runId === app.runId && app.apiBase === api ? 'pass' : 'unknown',
      runtime: app && {
        platform: app.platform,
        instanceId: app.instanceId,
        runId: app.runId,
        apiBase: app.apiBase,
        revision: app.revision,
      },
      server: identity,
      errors: [runtime, server]
        .filter((item) => item.status === 'rejected')
        .map((item) => item.reason.message),
    };
  }
  if (command === 'trace') {
    const missing = [];
    let snapshot, logs, db;
    try {
      snapshot = await observe(platform);
    } catch (error) {
      missing.push(`runtime: ${error.message}`);
    }
    try {
      logs = await backend('/__demo/requests');
    } catch (error) {
      missing.push(`server: ${error.message}`);
    }
    const requestId =
      args[1] === 'last'
        ? snapshot?.state.requests.filter((item) => item.method !== 'GET').at(-1)?.requestId ||
          logs?.find((item) => item.method !== 'GET' && item.platform === platform)?.request_id
        : args[1];
    if (!requestId)
      return { status: 'unknown', missing: [...missing, 'request ID; perform an action first'] };
    const clientRequest = snapshot?.state.requests.find((item) => item.requestId === requestId);
    const serverRequest = logs?.find((item) => item.request_id === requestId);
    const id = serverRequest?.route.split('/')[2] || serverRequest?.evidence?.after?.public_id;
    try {
      db = database(id);
    } catch (error) {
      missing.push(`database: ${error.message}`);
    }
    const runIds = [snapshot?.runId, serverRequest?.run_id, db?.config?.runId].filter(Boolean);
    if (new Set(runIds).size !== 1) missing.push('matching fixture run IDs');
    if (snapshot && snapshot.apiBase !== api) missing.push('client and CLI backend URLs differ');
    const row = id ? db?.rows.find((item) => item.public_id === id) : null;
    if (serverRequest?.method === 'POST' && serverRequest.status === 201 && !row)
      missing.push('created database row');
    return {
      ...assessTrace(clientRequest, serverRequest, row, missing),
      requestId,
      observedAt: new Date().toISOString(),
      frontend: snapshot && {
        platform: snapshot.platform,
        instanceId: snapshot.instanceId,
        runId: snapshot.runId,
        request: clientRequest,
        todo: snapshot.state.todos.find((item) => item.id === id),
      },
      backend: serverRequest,
      database: row,
      databaseRunId: db?.config.runId,
    };
  }
  if (command === 'perf-start') {
    await prepareCapture(platform);
    return observe(platform, 'globalThis.__TODO_DEBUG__.perfStart()');
  }
  if (command === 'perf-stop') return observe(platform, 'globalThis.__TODO_DEBUG__.perfStop()');
  if (command === 'screenshot') {
    const { browser, page } = await webPage();
    const path = resolve(option('out', `${root}/artifacts/web.png`));
    mkdirSync(dirname(path), { recursive: true });
    try {
      await page.screenshot({ path });
      return { path };
    } finally {
      await browser.close();
    }
  }
  if (command === 'perf-type') {
    if (platform !== 'web')
      throw new Error('perf-type uses real browser input; use Maestro or manual typing on iOS');
    const text = args[1]?.startsWith('--') || !args[1] ? 'Plan the next demo' : args[1];
    const { browser, page } = await webPage();
    const connection = await target('web');
    try {
      await page.getByTestId('draft').fill('');
      await prepareCapture('web');
      await connection.client.send('Profiler.enable');
      await connection.client.send('Profiler.start');
      await connection.client.evaluate('globalThis.__TODO_DEBUG__.perfStart()');
      const start = performance.now();
      await page.getByTestId('draft').pressSequentially(text, { delay: 75 });
      await page.waitForTimeout(150);
      const elapsedMs = performance.now() - start;
      const react = await connection.client.evaluate('globalThis.__TODO_DEBUG__.perfStop()');
      const cpu = await connection.client.send('Profiler.stop');
      return {
        input: {
          text,
          characters: text.length,
          delayMs: 75,
          elapsedMs,
          mechanism: 'Playwright real key events',
        },
        identity: await connection.client.evaluate('globalThis.__TODO_DEBUG__.snapshot()'),
        react,
        cpu,
        note: 'Development-build React render durations; CPU samples are separate. Elapsed includes scripted delays, not input latency.',
      };
    } finally {
      connection.client.close();
      await browser.close();
    }
  }
  throw new Error(`Unknown command ${command}. Run debug help.`);
}
try {
  const result = await run();
  if (result !== undefined) {
    const out = option('out');
    if (out && command !== 'screenshot') {
      mkdirSync(dirname(resolve(out)), { recursive: true });
      const json = JSON.stringify(result, null, 2) + '\n';
      writeFileSync(out, out.endsWith('.gz') ? gzipSync(json) : json);
    }
    const printable = args.includes('--full')
      ? result
      : compactResult(command, result, option('task'));
    console.log(JSON.stringify(printable, null, 2));
    const status = printable.status ?? result.status;
    process.exitCode = status === 'fail' ? 1 : status === 'unknown' ? 2 : 0;
  }
} catch (error) {
  console.log(JSON.stringify({ status: 'unknown', error: error.message }));
  process.exitCode = 2;
}

import WebSocket from 'ws';

export async function connect(url) {
  const ws = new WebSocket(url);
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => { ws.terminate(); reject(new Error('CDP connection timed out')); }, 5000);
    ws.once('open', () => { clearTimeout(timer); resolve(); });
    ws.once('error', error => { clearTimeout(timer); reject(error); });
  });
  let sequence = 0;
  const pending = new Map();
  ws.on('message', data => {
    const message = JSON.parse(String(data));
    const item = pending.get(message.id);
    if (!item) return;
    clearTimeout(item.timer); pending.delete(message.id);
    if (message.error) item.reject(new Error(message.error.message)); else item.resolve(message.result);
  });
  function cancel() { for (const item of pending.values()) { clearTimeout(item.timer); item.reject(new Error('CDP disconnected')); } pending.clear(); }
  ws.on('close', cancel); ws.on('error', cancel);
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++sequence;
    const timer = setTimeout(() => { pending.delete(id); reject(new Error(`${method} timed out`)); }, 15000);
    pending.set(id, { resolve, reject, timer }); ws.send(JSON.stringify({ id, method, params }));
  });
  return {
    send,
    async evaluate(expression) {
      const result = await send('Runtime.evaluate', { expression: `JSON.stringify(${expression})`, returnByValue: true });
      if (result.exceptionDetails) throw new Error(result.exceptionDetails.exception?.description || result.exceptionDetails.text || 'Runtime evaluation failed');
      if (result.result?.type === 'undefined') throw new Error('No value from app bridge');
      return JSON.parse(result.result.value);
    },
    close() { cancel(); ws.close(); },
  };
}

export async function target(platform) {
  if (!['web', 'ios'].includes(platform)) throw new Error('target must be web or ios');
  const endpoint = platform === 'web' ? process.env.DEMO_CDP || 'http://127.0.0.1:9337' : process.env.DEMO_METRO || 'http://127.0.0.1:8087';
  const response = await fetch(`${endpoint}/json/list`, { signal: AbortSignal.timeout(5000) });
  if (!response.ok) throw new Error(`Target discovery HTTP ${response.status}`);
  const targets = await response.json();
  const matches = [];
  for (const candidate of targets) {
    if (!candidate.webSocketDebuggerUrl || (process.env.DEMO_TARGET_ID && candidate.id !== process.env.DEMO_TARGET_ID)) continue;
    if (platform === 'web' && (!candidate.url?.startsWith(process.env.DEMO_WEB_URL || 'http://localhost:8087') && !candidate.url?.startsWith('http://127.0.0.1:8087'))) continue;
    let client;
    try {
      client = await connect(candidate.webSocketDebuggerUrl);
      await client.send('Runtime.enable');
      const snapshot = await client.evaluate('globalThis.__TODO_DEBUG__ ? globalThis.__TODO_DEBUG__.snapshot() : null');
      if (snapshot?.app === 'debug-cli-challenge' && snapshot.platform === platform) matches.push({ client, snapshot, targetId: candidate.id, debuggerUrl: candidate.webSocketDebuggerUrl });
      else client.close();
    } catch { client?.close(); }
  }
  if (matches.length !== 1) {
    matches.forEach(match => match.client.close());
    throw new Error(matches.length ? 'Multiple matching apps. Set DEMO_TARGET_ID.' : `No observable ${platform} Debug CLI Challenge target; open the development app and enable its bridge`);
  }
  return matches[0];
}
export async function observe(platform, expression = 'globalThis.__TODO_DEBUG__.snapshot()') {
  const connection = await target(platform);
  try { return await connection.client.evaluate(expression); } finally { connection.client.close(); }
}

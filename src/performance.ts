import type { ProfilerOnRenderCallback } from 'react';
interface Commit { id: string; phase: string; actualDuration: number; baseDuration: number; startTime: number; commitTime: number }
let recording = false;
let startedAt = '';
let timer: ReturnType<typeof setTimeout> | undefined;
let events: Commit[] = [];
let dropped = 0;
export const renderSettings = { flash: true };
export const onRender: ProfilerOnRenderCallback = (id, phase, actualDuration, baseDuration, startTime, commitTime) => {
  if (!recording) return;
  if (events.length >= 40000) { dropped++; return; }
  events.push({ id, phase, actualDuration, baseDuration, startTime, commitTime });
};
export function perfReport() {
  const rows = events.filter(event => event.id.startsWith('todo:'));
  const roots = events.filter(event => event.id === 'TodoScreen');
  const byComponent = new Map<string, number>();
  for (const event of rows) byComponent.set(event.id, (byComponent.get(event.id) || 0) + 1);
  return {
    source: 'React.Profiler via development bridge', recording, startedAt, observedAt: new Date().toISOString(),
    rowCommits: rows.length, distinctRows: byComponent.size, screenCommits: roots.length,
    screenRenderMs: roots.reduce((sum, event) => sum + event.actualDuration, 0),
    maxScreenRenderMs: Math.max(0, ...roots.map(event => event.actualDuration)),
    timingsAvailable: events.length ? events.some(event => event.actualDuration > 0) : null,
    flashEnabled: renderSettings.flash, dropped,
    topRows: [...byComponent].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id, commits]) => ({ id, commits })),
    events,
  };
}
export function perfStart(flash = false) {
  clearTimeout(timer); events = []; dropped = 0; startedAt = new Date().toISOString(); recording = true; renderSettings.flash = flash;
  timer = setTimeout(() => { recording = false; }, 60000);
  return { recording, startedAt, timeoutMs: 60000, flash };
}
export function perfStop() { clearTimeout(timer); recording = false; return perfReport(); }

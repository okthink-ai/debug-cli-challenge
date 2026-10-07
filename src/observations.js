/** @param {import('./types').RequestEvidence | undefined} request */
export function briefRequest(request) {
  if (!request) return null;
  return {
    requestId: request.requestId,
    at: request.at,
    method: request.method,
    route: request.route,
    status: request.status,
    ...(request.error ? { error: request.error } : {}),
  };
}

/**
 * @typedef {{ app: string, platform: string, instanceId: string, apiBase: string,
 * observedAt: string, runId?: string, revision?: string,
 * state: import('./types').Model }} Snapshot
 */

/** @param {Snapshot} snapshot */
export function runtimeIdentity(snapshot) {
  const { app, platform, instanceId, apiBase, observedAt, runId, revision } = snapshot;
  return { app, platform, instanceId, apiBase, observedAt, runId, revision };
}

/** @param {Snapshot} snapshot @param {string | undefined} taskId */
export function summarizeState(snapshot, taskId) {
  const { state } = snapshot;
  const task = taskId ? state.todos.find((todo) => todo.id === taskId) : undefined;
  const missing = [];
  if (!state.config || state.loading) missing.push('initialized app state');
  if (taskId && !task) missing.push(`task ${taskId}`);
  return {
    status: missing.length ? 'unknown' : 'observed',
    ...runtimeIdentity(snapshot),
    tasks: {
      total: state.todos.length,
      completed: state.todos.filter((todo) => todo.completed).length,
    },
    settings: { priority: state.priority, capabilityRevision: state.capabilityRevision },
    draft: state.draft,
    pending: state.pending,
    notice: state.notice,
    error: state.error,
    latestRequest: briefRequest(state.requests.at(-1)),
    ...(taskId ? { task: task ?? null } : {}),
    ...(missing.length ? { missing } : {}),
  };
}

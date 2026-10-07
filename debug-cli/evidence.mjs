export function compare(web, ios) {
  const missing = [!web && 'web runtime', !ios && 'ios runtime'].filter(Boolean);
  if (missing.length) return { status: 'unknown', claim: 'Both runtimes hold the same priority contract', missing };
  if (!web.runId || web.runId !== ios.runId) return { status: 'unknown', missing: ['matching fixture run IDs'], runs: [web.runId, ios.runId] };
  const values = [web, ios].map(snapshot => ({ platform: snapshot.platform, instanceId: snapshot.instanceId, runId: snapshot.runId, observedAt: snapshot.observedAt, priority: snapshot.state.priority, capabilityRevision: snapshot.state.capabilityRevision, savedPreference: snapshot.state.savedPreference }));
  const complete = values.every(value => value.capabilityRevision > 0 && value.priority);
  return { status: !complete ? 'unknown' : values[0].priority === values[1].priority && values[0].capabilityRevision === values[1].capabilityRevision ? 'pass' : 'fail', claim: 'Both runtimes hold the same priority contract (not a UI interaction check)', values, missing: complete ? [] : ['initialized priority contract'] };
}
export function assessTrace(clientRequest, serverRequest, database, missing = []) {
  const failures = [];
  if (clientRequest?.status >= 400) failures.push(`Client received HTTP ${clientRequest.status}`);
  if (serverRequest?.status >= 400) failures.push(`Server returned HTTP ${serverRequest.status}`);
  const expected = clientRequest?.body?.completed;
  if (serverRequest?.method === 'PATCH' && serverRequest.status === 200 && serverRequest.evidence?.rowsAffected === 0) failures.push('API acknowledged completion but SQLite updated zero rows');
  if (typeof expected === 'boolean' && database && Boolean(database.completed) !== expected) failures.push('Persisted completion disagrees with the submitted intent');
  if (clientRequest && clientRequest.status === null) missing.push('completed client response');
  if (clientRequest?.status && serverRequest?.status && clientRequest.status !== serverRequest.status) failures.push('Client and server status disagree for the request');
  if (serverRequest?.method === 'POST' && serverRequest.status === 201) {
    if (!database) missing.push('created database row');
    else if (database.title !== clientRequest?.body?.title?.trim() || database.priority !== clientRequest?.body?.priority) {
      if (clientRequest) failures.push('Created row disagrees with the submitted task');
    }
  }
  if (!clientRequest) missing.push('client request');
  if (!serverRequest) missing.push('server request');
  if (!database && typeof expected === 'boolean') missing.push('database row');
  return { status: failures.length ? 'fail' : missing.length ? 'unknown' : 'pass', claim: 'This request was accepted and its intended effect persisted; native taps are a separate check', failures, missing: [...new Set(missing)] };
}

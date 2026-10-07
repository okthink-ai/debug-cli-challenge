import { briefRequest, summarizeState } from '../src/observations.js';

const reactSummary = ({ events, ...summary }) => ({ ...summary, eventCount: events.length });
export function compactResult(command, result, taskId) {
  if (command === 'state') return result.state ? summarizeState(result, taskId) : result;
  if (command === 'requests') return result.slice(-5).map(briefRequest);
  if (command === 'server')
    return {
      identity: result.identity,
      requests: result.requests.slice(0, 5).map((row) => ({
        requestId: row.request_id,
        at: row.at,
        method: row.method,
        route: row.route,
        platform: row.platform,
        status: row.status,
        sql: row.evidence.sql,
        rowsAffected: row.evidence.rowsAffected,
      })),
    };
  if (command === 'trace')
    return {
      status: result.status,
      requestId: result.requestId,
      observedAt: result.observedAt,
      platform: result.frontend?.platform,
      runId: result.frontend?.runId ?? result.databaseRunId,
      intent: result.frontend?.request && {
        method: result.frontend.request.method,
        route: result.frontend.request.route,
        body: result.frontend.request.body,
      },
      result: {
        clientStatus: result.frontend?.request?.status,
        serverStatus: result.backend?.status,
        rowsAffected: result.backend?.evidence?.rowsAffected,
      },
      sql: result.backend?.evidence?.sql,
      params: result.backend?.evidence?.params,
      stored: result.database,
      failures: result.failures ?? [],
      missing: result.missing ?? [],
    };
  if (command === 'perf-stop') return reactSummary(result);
  if (command === 'perf-type')
    return {
      input: result.input,
      identity: { platform: result.identity.platform, runId: result.identity.runId },
      react: reactSummary(result.react),
      cpu: { nodes: result.cpu.profile.nodes.length, samples: result.cpu.profile.samples?.length },
      note: result.note,
    };
  return result;
}

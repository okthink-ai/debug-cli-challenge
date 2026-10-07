export interface Todo { id: string; title: string; completed: boolean; priority: string; project: string }
export interface Config {
  app: string; revision: string; runId: string; mode: string; count: number;
  capabilities: { revision: number; priorities: string[] };
}
export interface RequestEvidence {
  requestId: string; at: string; method: string; route: string; body: unknown;
  submitted: { priority: string; capabilityRevision: number }; status: number | null;
  response?: unknown; error?: string;
}
export interface Model {
  config: Config | null; todos: Todo[]; draft: string; priority: string;
  capabilityRevision: number; savedPreference: { priority: string; revision: number } | null;
  loading: boolean; pending: boolean; notice: string; error: string | null;
  requests: RequestEvidence[];
}

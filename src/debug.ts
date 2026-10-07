import { Platform } from 'react-native';
import {
  actions,
  apiBase,
  instanceId,
  store,
  initialize,
  addTodo,
  toggleTodo,
  refresh,
} from './store';
import { perfReport, perfStart, perfStop } from './performance';
import { setRenderFlash } from './render-flash';
import { runtimeIdentity, summarizeState } from './observations';

const snapshot = () => ({
  app: 'debug-cli-challenge',
  platform: Platform.OS,
  instanceId,
  observedAt: new Date().toISOString(),
  apiBase,
  revision: store.getState().config?.revision,
  runId: store.getState().config?.runId,
  state: store.getState(),
});
export const debugBridge = {
  snapshot,
  identity: () => runtimeIdentity(snapshot()),
  state: (taskId?: string) => summarizeState(snapshot(), taskId),
  perfStart,
  perfStop,
  perfReport,
  setFlash: setRenderFlash,
  // Application actions are explicitly not native taps. UI verification uses Playwright / Maestro.
  actions: {
    initialize,
    addTodo,
    toggleTodo,
    refresh,
    draft: (text: string) => store.dispatch(actions.draft(text)),
  },
};
export function installDebugBridge() {
  if (__DEV__) Object.assign(globalThis, { __TODO_DEBUG__: debugBridge });
}

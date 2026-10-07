import { configureStore, createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';
import { useDispatch, useSelector } from 'react-redux';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Config, Model, RequestEvidence, Todo } from './types';

export const apiBase = process.env.EXPO_PUBLIC_API_URL || 'http://127.0.0.1:4310';
export const instanceId = `${Platform.OS}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const initialState: Model = { config: null, todos: [], draft: '', priority: 'high', capabilityRevision: 0, savedPreference: null, loading: true, pending: false, notice: '', error: null, requests: [] };
const slice = createSlice({ name: 'todo', initialState, reducers: {
  patch: (state, action: PayloadAction<Partial<Model>>) => { Object.assign(state, action.payload); },
  draft: (state, action: PayloadAction<string>) => { state.draft = action.payload; },
  upsert: (state, action: PayloadAction<Todo>) => {
    const index = state.todos.findIndex(todo => todo.id === action.payload.id);
    if (index === -1) state.todos.unshift(action.payload); else state.todos[index] = action.payload;
  },
  request: (state, action: PayloadAction<RequestEvidence>) => {
    const index = state.requests.findIndex(item => item.requestId === action.payload.requestId);
    if (index === -1) state.requests.push(action.payload); else state.requests[index] = action.payload;
    if (state.requests.length > 40) state.requests.shift();
  },
} });
export const store = configureStore({ reducer: slice.reducer });
export const actions = slice.actions;
export const useAppDispatch = useDispatch.withTypes<typeof store.dispatch>();
export const useAppSelector = useSelector.withTypes<Model>();
let sequence = 0;
async function fetchJson(url: string, options: RequestInit = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return { response, data: await response.json() };
  } finally { clearTimeout(timer); }
}
async function request(route: string, method = 'GET', body?: unknown) {
  const state = store.getState();
  const evidence: RequestEvidence = { requestId: `${instanceId}-${++sequence}`, at: new Date().toISOString(), method, route, body: body ?? null, submitted: { priority: state.priority, capabilityRevision: state.capabilityRevision }, status: null };
  store.dispatch(actions.request(evidence));
  try {
    const { response, data } = await fetchJson(`${apiBase}${route}`, {
      method, headers: { 'Content-Type': 'application/json', 'X-Request-ID': evidence.requestId, 'X-Platform': Platform.OS },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    store.dispatch(actions.request({ ...evidence, status: response.status, response: data }));
    if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
    return data;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const recorded = store.getState().requests.find(item => item.requestId === evidence.requestId) || evidence;
    store.dispatch(actions.request({ ...recorded, error: message }));
    throw error;
  }
}
export async function initialize() {
  store.dispatch(actions.patch({ loading: true, error: null, notice: '', draft: '', requests: [] }));
  try {
    const { response, data } = await fetchJson(`${apiBase}/config`);
    if (!response.ok) throw new Error('Local backend unavailable');
    const config: Config = data;
    let saved = { priority: 'high', revision: 2 };
    if (Platform.OS === 'ios') {
      const key = 'debug-cli-challenge:priority';
      const raw = await AsyncStorage.getItem(key);
      const cache = raw ? JSON.parse(raw) : null;
      // Seed the same historical preference for each new fixture run.
      saved = cache?.runId === config.runId ? cache.preference : { priority: 'urgent', revision: 1 };
      await AsyncStorage.setItem(key, JSON.stringify({ runId: config.runId, preference: saved }));
    }
    const effective = Platform.OS === 'ios' ? saved : { priority: 'high', revision: 2 };
    store.dispatch(actions.patch({ config, savedPreference: saved, priority: effective.priority, capabilityRevision: effective.revision }));
    await refresh();
  } catch (error) { store.dispatch(actions.patch({ error: String(error) })); }
  finally { store.dispatch(actions.patch({ loading: false })); }
}
export async function refresh() {
  try { const data = await request('/todos'); store.dispatch(actions.patch({ todos: data.todos })); }
  catch (error) { store.dispatch(actions.patch({ error: String(error) })); }
}
export async function addTodo() {
  const state = store.getState();
  if (!state.draft.trim() || state.pending) return;
  store.dispatch(actions.patch({ pending: true, error: null, notice: '' }));
  try {
    const priority = state.priority;
    const data = await request('/todos', 'POST', { title: state.draft, priority });
    store.dispatch(actions.upsert(data.todo));
    store.dispatch(actions.patch({ draft: '', notice: 'Added to your list' }));
  } catch (error) { store.dispatch(actions.patch({ error: String(error) })); }
  finally { store.dispatch(actions.patch({ pending: false })); }
}
export async function toggleTodo(id: string) {
  const state = store.getState();
  const todo = state.todos.find(item => item.id === id);
  if (!todo || state.pending) return;
  store.dispatch(actions.patch({ pending: true, error: null, notice: '' }));
  store.dispatch(actions.upsert({ ...todo, completed: !todo.completed }));
  try {
    const data = await request(`/todos/${id}`, 'PATCH', { completed: !todo.completed });
    store.dispatch(actions.upsert(data.todo));
    store.dispatch(actions.patch({ notice: data.todo.completed ? 'Completed · saved' : 'Moved back to your list' }));
  } catch (error) { store.dispatch(actions.upsert(todo)); store.dispatch(actions.patch({ error: String(error) })); }
  finally { store.dispatch(actions.patch({ pending: false })); }
}

import AsyncStorage from '@react-native-async-storage/async-storage';

/** Model an existing installation opening after the server's priority vocabulary changed. */
export async function restoreFixturePreference(runId: string) {
  const key = 'debug-cli-challenge:priority';
  const raw = await AsyncStorage.getItem(key);
  const cache = raw ? JSON.parse(raw) : null;
  const preference: { priority: string; revision: number } =
    cache?.runId === runId ? cache.preference : { priority: 'urgent', revision: 1 };
  await AsyncStorage.setItem(key, JSON.stringify({ runId, preference }));
  return preference;
}

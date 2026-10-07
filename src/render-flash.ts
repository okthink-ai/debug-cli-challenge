import { useSyncExternalStore } from 'react';

let enabled = true;
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};
export const getRenderFlash = () => enabled;
export function setRenderFlash(value: boolean) {
  if (value !== enabled) {
    enabled = value;
    listeners.forEach((listener) => listener());
  }
  return enabled;
}
export function useRenderFlash() {
  return useSyncExternalStore(subscribe, getRenderFlash, getRenderFlash);
}

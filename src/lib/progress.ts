import { useSyncExternalStore } from "react";

// Transfers report hundreds of updates. Only the progress bar subscribes, so
// each one re-renders that leaf instead of the page driving the GATT link.
let current = 0;
const listeners = new Set<() => void>();

export function setProgress(percent: number) {
  current = percent;
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useProgress() {
  return useSyncExternalStore(
    subscribe,
    () => current,
    () => 0,
  );
}

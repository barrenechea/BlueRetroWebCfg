import { useCallback, useMemo, useSyncExternalStore } from "react";

// `storage` only fires in other tabs, so same-tab writes dispatch this too.
const LOCAL_EVENT = "blueretro:local-storage";

function subscribe(onChange: () => void) {
  window.addEventListener("storage", onChange);
  window.addEventListener(LOCAL_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onChange);
    window.removeEventListener(LOCAL_EVENT, onChange);
  };
}

function readRaw(key: string) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function parse<T>(raw: string | null, initial: T): T {
  if (!raw) return initial;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return initial;
  }
}

// Server render and hydration use `initial`; React then re-renders with the
// stored value, so SSR markup never mismatches.
export function useLocalStorage<T>(key: string, initial: T) {
  const raw = useSyncExternalStore(
    subscribe,
    () => readRaw(key),
    () => null,
  );
  const value = useMemo(() => parse(raw, initial), [raw, initial]);

  const setValue = useCallback(
    (next: T | ((prev: T) => T)) => {
      const prev = parse(readRaw(key), initial);
      const resolved =
        typeof next === "function" ? (next as (p: T) => T)(prev) : next;
      localStorage.setItem(key, JSON.stringify(resolved));
      window.dispatchEvent(new Event(LOCAL_EVENT));
    },
    [key, initial],
  );

  return [value, setValue] as const;
}

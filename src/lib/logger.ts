import { useSyncExternalStore } from "react";

export interface LogLine {
  id: number;
  time: Date;
  text: string;
  error: boolean;
}

export interface LogState {
  lines: LogLine[];
  // Set by the global error handler when the browser lacks a feature.
  status: string;
}

let state: LogState = { lines: [], status: "" };
let nextId = 0;
const listeners = new Set<() => void>();
const SERVER_STATE: LogState = { lines: [], status: "" };

function update(next: Partial<LogState>) {
  state = { ...state, ...next };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useLog() {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => SERVER_STATE,
  );
}

export const ChromeSamples = {
  log: function (...arguments_: unknown[]) {
    const text = arguments_
      .map((argument) =>
        typeof argument === "string" ? argument : JSON.stringify(argument),
      )
      .join(" ");
    const line: LogLine = {
      id: nextId++,
      time: new Date(),
      text,
      error: /^Argh!|error|mismatch|invalid/i.test(text),
    };
    update({ lines: [...state.lines, line] });
  },

  clearLog: function () {
    update({ lines: [], status: "" });
  },

  setStatus: function (status: string) {
    update({ status });
  },
};

export const log = (...args: unknown[]) => ChromeSamples.log(...args);

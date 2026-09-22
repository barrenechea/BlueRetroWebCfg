// Web Bluetooth GATT accesses are stateful sequences per characteristic and
// must not interleave, so every device read/write is serialized through a
// single async queue, no matter which tab's query triggers it.
let tail: Promise<unknown> = Promise.resolve();

export function gattSerial<T>(fn: () => Promise<T>): Promise<T> {
  const run = tail.then(fn);
  tail = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

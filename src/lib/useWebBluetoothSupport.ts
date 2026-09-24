import { useSyncExternalStore } from "react";

export type WebBluetoothSupport = "supported" | "unsupported" | "insecure";

// Availability cannot change during a session, so there is nothing to
// subscribe to.
const subscribe = () => () => {};

function read(): WebBluetoothSupport {
  if (navigator.bluetooth) {
    return "supported";
  }
  // The API is only exposed in a secure context, so an http:// origin looks
  // exactly like an unsupported browser. Tell the two apart, otherwise Chrome
  // users on a plain LAN address get told to install Chrome.
  return window.isSecureContext ? "unsupported" : "insecure";
}

// Prerendering has no navigator. Assume support so the static HTML matches the
// common case; useSyncExternalStore re-renders with the real value on hydration.
const readServer = (): WebBluetoothSupport => "supported";

export function useWebBluetoothSupport() {
  return useSyncExternalStore(subscribe, read, readServer);
}

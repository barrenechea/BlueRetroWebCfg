import { useCallback, useRef, useState } from "react";

import { brUuid } from "./constants";
import { ChromeSamples, log } from "./logger";

export interface ConnInfo {
  name: string;
  bdaddr: string;
  appVer: string;
  latestVer: string;
}

export interface BlueRetroDevice {
  device: BluetoothDevice;
  service: BluetoothRemoteGATTService;
}

export const isNotFoundError = (error: unknown): boolean =>
  error instanceof DOMException &&
  (error.name === "NotFoundError" || error.name === "NotSupportedError");

export function useBlueRetroConnection() {
  const [connected, setConnected] = useState(false);
  const [info, setInfo] = useState<ConnInfo | null>(null);
  const serviceRef = useRef<BluetoothRemoteGATTService | null>(null);

  const onDisconnected = useCallback(() => {
    log("> Bluetooth Device disconnected");
    setConnected(false);
  }, []);

  const connect = useCallback(
    async (logDeviceInfo = false): Promise<BlueRetroDevice | undefined> => {
      try {
        ChromeSamples.log("Requesting Bluetooth Device...");
        const device = await navigator.bluetooth.requestDevice({
          filters: [{ namePrefix: "BlueRetro" }],
          optionalServices: [brUuid[0]],
        });
        ChromeSamples.log("Connecting to GATT Server...");
        if (logDeviceInfo) {
          ChromeSamples.log("Device name: " + device.name);
          ChromeSamples.log("Device id: " + device.id);
        }
        device.addEventListener("gattserverdisconnected", onDisconnected);
        const server = await device.gatt!.connect();
        ChromeSamples.log("Getting BlueRetro Service...");
        const service = await server.getPrimaryService(brUuid[0]);
        serviceRef.current = service;
        return { device, service };
      } catch (error) {
        ChromeSamples.log((error as Error).name);
        ChromeSamples.log("Argh! Couldn't connect to BlueRetro");
        return undefined;
      }
    },
    [onDisconnected],
  );

  return {
    connected,
    setConnected,
    info,
    setInfo,
    serviceRef,
    connect,
  };
}

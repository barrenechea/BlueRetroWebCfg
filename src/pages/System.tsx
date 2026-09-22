import { useMutation } from "@tanstack/react-query";

import { useBlueRetro } from "../components/BlueRetroContext";
import { WikiIntro } from "../components/WikiIntro";
import { gattSerial } from "../lib/blueretro/gattSerial";
import { setDeepSleep } from "../lib/blueretro/setDeepSleep";
import { setFactoryReset } from "../lib/blueretro/setFactoryReset";
import { setReset } from "../lib/blueretro/setReset";
import { log } from "../lib/logger";

export function System() {
  const { connected, serviceRef } = useBlueRetro();

  const sleepMutation = useMutation({
    mutationFn: () => gattSerial(() => setDeepSleep(serviceRef.current!)),
    onError: (error) => log("Argh! " + error),
  });
  const resetMutation = useMutation({
    mutationFn: () => gattSerial(() => setReset(serviceRef.current!)),
    onError: (error) => log("Argh! " + error),
  });
  const factoryMutation = useMutation({
    mutationFn: () => gattSerial(() => setFactoryReset(serviceRef.current!)),
    onError: (error) => log("Argh! " + error),
  });

  return (
    <>
      <WikiIntro
        url="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#4---system-manager-page"
        label="4 - System manager page"
      />

      {connected && (
        <>
          <div id="divSleep" style={{ marginBottom: "1em" }}>
            <button id="btnSleep" onClick={() => sleepMutation.mutate()}>
              Put in Deep Sleep
            </button>
          </div>
          <div id="divReset" style={{ marginBottom: "1em" }}>
            <button id="btnReset" onClick={() => resetMutation.mutate()}>
              Reset
            </button>
          </div>
          <div id="divFactory" style={{ marginBottom: "1em" }}>
            <button id="btnFactory" onClick={() => factoryMutation.mutate()}>
              Factory Reset
            </button>
          </div>
        </>
      )}
    </>
  );
}

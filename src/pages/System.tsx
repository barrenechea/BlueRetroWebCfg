import { useBlueRetro } from "../components/BlueRetroContext";
import { WikiIntro } from "../components/WikiIntro";
import { setDeepSleep } from "../lib/blueretro/setDeepSleep";
import { setFactoryReset } from "../lib/blueretro/setFactoryReset";
import { setReset } from "../lib/blueretro/setReset";

export function System() {
  const { connected, serviceRef } = useBlueRetro();

  return (
    <>
      <WikiIntro
        url="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#4---system-manager-page"
        label="4 - System manager page"
      />

      {connected && (
        <>
          <div id="divSleep" style={{ marginBottom: "1em" }}>
            <button
              id="btnSleep"
              onClick={() => setDeepSleep(serviceRef.current!)}
            >
              Put in Deep Sleep
            </button>
          </div>
          <div id="divReset" style={{ marginBottom: "1em" }}>
            <button id="btnReset" onClick={() => setReset(serviceRef.current!)}>
              Reset
            </button>
          </div>
          <div id="divFactory" style={{ marginBottom: "1em" }}>
            <button
              id="btnFactory"
              onClick={() => setFactoryReset(serviceRef.current!)}
            >
              Factory Reset
            </button>
          </div>
        </>
      )}
    </>
  );
}

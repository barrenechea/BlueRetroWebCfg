import { ConnectButton } from "../components/ConnectButton";
import { DivInfo } from "../components/DivInfo";
import { OutputPanel } from "../components/OutputPanel";
import { PageLayout } from "../components/PageLayout";
import { WikiIntro } from "../components/WikiIntro";
import { getAppVersion } from "../lib/blueretro/getAppVersion";
import { getBdAddr } from "../lib/blueretro/getBdAddr";
import { getLatestRelease } from "../lib/blueretro/getLatestRelease";
import { isWebBluetoothEnabled } from "../lib/blueretro/isWebBluetoothEnabled";
import { setDeepSleep } from "../lib/blueretro/setDeepSleep";
import { setFactoryReset } from "../lib/blueretro/setFactoryReset";
import { setReset } from "../lib/blueretro/setReset";
import { ChromeSamples, log } from "../lib/logger";
import {
  isNotFoundError,
  useBlueRetroConnection,
} from "../lib/useBlueRetroConnection";

export function System() {
  const { connected, setConnected, info, setInfo, serviceRef, connect } =
    useBlueRetroConnection();

  async function btConn() {
    if (!isWebBluetoothEnabled()) return;
    ChromeSamples.clearLog();
    const conn = await connect(true);
    if (!conn) return;
    try {
      const bdaddr = await getBdAddr(conn.service);
      const latest_ver = await getLatestRelease();
      const app_ver = await getAppVersion(conn.service);
      setInfo({
        name: conn.device.name ?? "",
        bdaddr,
        appVer: app_ver,
        latestVer: latest_ver,
      });
      setConnected(true);
    } catch (error) {
      if (isNotFoundError(error)) {
        setInfo({
          name: conn.device.name ?? "",
          bdaddr: "",
          appVer: "",
          latestVer: "",
        });
        setConnected(true);
      } else {
        log("Argh! " + error);
      }
    }
  }

  return (
    <PageLayout title="BlueRetro System Manager">
      <WikiIntro
        url="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#4---system-manager-page"
        label="4 - System manager page"
      />

      <ConnectButton
        hint="Disconnect all controllers from BlueRetro before connecting for update."
        onClick={btConn}
      />
      {info && <DivInfo {...info} />}
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

      <OutputPanel />
    </PageLayout>
  );
}

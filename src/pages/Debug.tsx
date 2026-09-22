import { useRef, useState } from "react";

import { ConnectButton } from "../components/ConnectButton";
import { DivInfo } from "../components/DivInfo";
import { OutputPanel } from "../components/OutputPanel";
import { PageLayout } from "../components/PageLayout";
import { ProgressBar } from "../components/ProgressBar";
import { WikiIntro } from "../components/WikiIntro";
import { dcReadFile } from "../lib/blueretro/dcReadFile";
import { downloadFile } from "../lib/blueretro/downloadFile";
import { getAppVersion } from "../lib/blueretro/getAppVersion";
import { getBdAddr } from "../lib/blueretro/getBdAddr";
import { getLatestRelease } from "../lib/blueretro/getLatestRelease";
import { isWebBluetoothEnabled } from "../lib/blueretro/isWebBluetoothEnabled";
import { ChromeSamples, log } from "../lib/logger";
import { resetProgress, setProgress, showProgressBar } from "../lib/progress";
import type { CancelRef } from "../lib/types";
import {
  isNotFoundError,
  useBlueRetroConnection,
} from "../lib/useBlueRetroConnection";

export function Debug() {
  const { connected, setConnected, info, setInfo, serviceRef, connect } =
    useBlueRetroConnection();
  const [transferring, setTransferring] = useState(false);
  // Real ref object so the recursive reader's cancel check works (the old
  // code passed a plain number, which made Cancel a no-op).
  const cancelRef = useRef<CancelRef>({ current: 0 });

  function abortFileTransfer() {
    cancelRef.current.current = 1;
  }

  async function btConn() {
    if (!isWebBluetoothEnabled()) return;
    ChromeSamples.clearLog();
    const conn = await connect();
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

  async function pakRead() {
    resetProgress();
    showProgressBar();
    setTransferring(true);
    try {
      const value = await dcReadFile(
        serviceRef.current!,
        setProgress,
        cancelRef.current,
      );
      downloadFile(
        new Blob([value.buffer as ArrayBuffer], { type: "application/bin" }),
        "br_debug_trace.bin",
      );
    } catch (error) {
      log("Argh! " + error);
      cancelRef.current.current = 0;
    }
    setTransferring(false);
  }

  return (
    <PageLayout title="BlueRetro Debug">
      <WikiIntro
        url="https://github.com/darthcloud/BlueRetroWiki/blob/master/Debug-trace.md"
        label="Debug Trace Documentation"
      />

      <ConnectButton
        hint="Disconnect all controllers from BlueRetro before connecting for debug."
        onClick={btConn}
      />
      {info && <DivInfo {...info} />}
      {connected && !transferring && (
        <div id="divFileSelect" style={{ marginBottom: "1em" }}>
          <button id="btnPakRead" onClick={pakRead}>
            Download debug trace
          </button>
        </div>
      )}
      {connected && transferring && (
        <div id="divFileTransfer" style={{ marginBottom: "1em" }}>
          <ProgressBar />
          <button id="btnFileTransferCancel" onClick={abortFileTransfer}>
            Cancel
          </button>
        </div>
      )}

      <OutputPanel />
    </PageLayout>
  );
}

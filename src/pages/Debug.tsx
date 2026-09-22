import { useRef, useState } from "react";

import { useBlueRetro } from "../components/BlueRetroContext";
import { ProgressBar } from "../components/ProgressBar";
import { WikiIntro } from "../components/WikiIntro";
import { dcReadFile } from "../lib/blueretro/dcReadFile";
import { downloadFile } from "../lib/blueretro/downloadFile";
import { log } from "../lib/logger";
import { resetProgress, setProgress, showProgressBar } from "../lib/progress";
import type { CancelRef } from "../lib/types";

export function Debug() {
  const { connected, serviceRef } = useBlueRetro();
  const [transferring, setTransferring] = useState(false);
  // Real ref object so the recursive reader's cancel check works (the old
  // code passed a plain number, which made Cancel a no-op).
  const cancelRef = useRef<CancelRef>({ current: 0 });

  function abortFileTransfer() {
    cancelRef.current.current = 1;
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
    <>
      <WikiIntro
        url="https://github.com/darthcloud/BlueRetroWiki/blob/master/Debug-trace.md"
        label="Debug Trace Documentation"
      />

      {connected && !transferring && (
        <div id="divFileSelect" style={{ marginBottom: "1em" }}>
          <button id="btnPakRead" onClick={() => void pakRead()}>
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
    </>
  );
}

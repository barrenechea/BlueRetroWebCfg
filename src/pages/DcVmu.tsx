import { useRef, useState } from "react";

import { useBlueRetro } from "../components/BlueRetroContext";
import { ProgressBar } from "../components/ProgressBar";
import { WikiIntro } from "../components/WikiIntro";
import { dcReadFile } from "../lib/blueretro/dcReadFile";
import { dcWriteFile } from "../lib/blueretro/dcWriteFile";
import { downloadFile } from "../lib/blueretro/downloadFile";
import { vmuSize } from "../lib/constants";
import { log } from "../lib/logger";
import { resetProgress, setProgress, showProgressBar } from "../lib/progress";
import type { CancelRef } from "../lib/types";

function swapBytes(data: ArrayBuffer) {
  const view = new DataView(data);
  for (let i = 0; i < vmuSize; i += 4) {
    view.setUint32(i, view.getUint32(i), true);
  }
}

export function DcVmu() {
  const { connected, serviceRef } = useBlueRetro();
  const [transferring, setTransferring] = useState(false);
  // Real ref object so the recursive readers/writers' cancel check works
  // (the old code passed a plain number, which made Cancel a no-op).
  const cancelRef = useRef<CancelRef>({ current: 0 });

  function abortFileTransfer() {
    cancelRef.current.current = 1;
  }

  function pakRead() {
    resetProgress();
    showProgressBar();
    setTransferring(true);
    dcReadFile(serviceRef.current!, setProgress, cancelRef.current)
      .then((value) => {
        swapBytes(value.buffer as ArrayBuffer);
        downloadFile(
          new Blob([value.buffer as ArrayBuffer], { type: "application/bin" }),
          "vmu.bin",
        );
        cancelRef.current.current = 0;
      })
      .catch((error) => {
        log("Argh! " + error);
        cancelRef.current.current = 0;
      })
      .finally(() => {
        setTransferring(false);
      });
  }

  function pakWrite() {
    resetProgress();
    const reader = new FileReader();
    reader.onerror = () => {
      log("An error occurred reading this file.");
    };
    reader.onabort = function () {
      log("File read cancelled");
    };
    reader.onload = function () {
      const data = (reader.result as ArrayBuffer).slice(0, vmuSize);
      swapBytes(data);
      showProgressBar();
      setTransferring(true);
      dcWriteFile(serviceRef.current!, data, setProgress, cancelRef.current)
        .then(() => {
          cancelRef.current.current = 0;
        })
        .catch((error) => {
          log("Argh! " + error);
          cancelRef.current.current = 0;
        })
        .finally(() => {
          setTransferring(false);
        });
    };
    reader.readAsArrayBuffer(
      (document.getElementById("pakFile") as HTMLInputElement).files![0],
    );
  }

  return (
    <>
      <WikiIntro
        url="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#72---dc-vmu-manager-page"
        label="7.2 - DC VMU manager page"
      />

      {connected && !transferring && (
        <div id="divFileSelect" style={{ marginBottom: "1em" }}>
          <button id="btnPakRead" onClick={pakRead}>
            Read
          </button>
          <br />
          <br />
          <button id="btnPakWrite" onClick={pakWrite}>
            Write
          </button>
          Select .BIN file to write:
          <input type="file" id="pakFile" />
          <br />
          <br />
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

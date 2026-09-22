import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";

import { useBlueRetro } from "../components/BlueRetroContext";
import { ProgressBar } from "../components/ProgressBar";
import { WikiIntro } from "../components/WikiIntro";
import { dcReadFile } from "../lib/blueretro/dcReadFile";
import { dcWriteFile } from "../lib/blueretro/dcWriteFile";
import { downloadFile } from "../lib/blueretro/downloadFile";
import { gattSerial } from "../lib/blueretro/gattSerial";
import { vmuSize } from "../lib/constants";
import { log } from "../lib/logger";
import { setProgress } from "../lib/progress";
import type { CancelRef } from "../lib/types";

function swapBytes(data: ArrayBuffer) {
  const view = new DataView(data);
  for (let i = 0; i < vmuSize; i += 4) {
    view.setUint32(i, view.getUint32(i), true);
  }
}

export function DcVmu() {
  const { connected, serviceRef } = useBlueRetro();
  // Real ref object so the recursive readers/writers' cancel check works
  // (the old code passed a plain number, which made Cancel a no-op).
  const cancelRef = useRef<CancelRef>({ current: 0 });

  const vmuReadMutation = useMutation({
    mutationFn: () =>
      gattSerial(() =>
        dcReadFile(serviceRef.current!, setProgress, cancelRef.current),
      ),
    onSuccess: (value) => {
      swapBytes(value.buffer as ArrayBuffer);
      downloadFile(
        new Blob([value.buffer as ArrayBuffer], { type: "application/bin" }),
        "vmu.bin",
      );
    },
    onError: (error) => log("Argh! " + error),
    onSettled: () => {
      cancelRef.current.current = 0;
    },
  });

  const vmuWriteMutation = useMutation({
    mutationFn: (data: ArrayBuffer) =>
      gattSerial(() =>
        dcWriteFile(serviceRef.current!, data, setProgress, cancelRef.current),
      ),
    onError: (error) => log("Argh! " + error),
    onSettled: () => {
      cancelRef.current.current = 0;
    },
  });

  const transferring = vmuReadMutation.isPending || vmuWriteMutation.isPending;

  function abortFileTransfer() {
    cancelRef.current.current = 1;
  }

  function pakRead() {
    vmuReadMutation.mutate();
  }

  function pakWrite() {
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
      vmuWriteMutation.mutate(data);
    };
    // Read in the image file as a binary string.
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

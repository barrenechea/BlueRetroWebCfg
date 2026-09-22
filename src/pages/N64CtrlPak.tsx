import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";

import { useBlueRetro } from "../components/BlueRetroContext";
import { ProgressBar } from "../components/ProgressBar";
import { WikiIntro } from "../components/WikiIntro";
import { downloadFile } from "../lib/blueretro/downloadFile";
import { gattSerial } from "../lib/blueretro/gattSerial";
import { makeFormattedPak } from "../lib/blueretro/makeFormattedPak";
import { n64ReadFile } from "../lib/blueretro/n64ReadFile";
import { n64WriteFile } from "../lib/blueretro/n64WriteFile";
import { pakSize } from "../lib/constants";
import { log } from "../lib/logger";
import { setProgress } from "../lib/progress";
import type { CancelRef } from "../lib/types";

export function N64CtrlPak() {
  const { connected, serviceRef } = useBlueRetro();
  const [pak, setPak] = useState(0);
  // Real ref object so the recursive readers/writers' cancel check works
  // (the old code passed a plain number, which made Cancel a no-op).
  const cancelRef = useRef<CancelRef>({ current: 0 });

  const pakReadMutation = useMutation({
    mutationFn: () =>
      gattSerial(() =>
        n64ReadFile(serviceRef.current!, pak, setProgress, cancelRef.current),
      ),
    onSuccess: (value) => {
      downloadFile(
        new Blob([value.buffer as ArrayBuffer], { type: "application/mpk" }),
        "ctrl_pak" + (pak + 1) + ".mpk",
      );
    },
    onError: (error) => log("Argh! " + error),
    onSettled: () => {
      cancelRef.current.current = 0;
    },
  });

  const pakWriteMutation = useMutation({
    mutationFn: (data: ArrayBuffer) =>
      gattSerial(() =>
        n64WriteFile(
          serviceRef.current!,
          data,
          pak,
          setProgress,
          cancelRef.current,
        ),
      ),
    onError: (error) => log("Argh! " + error),
    onSettled: () => {
      cancelRef.current.current = 0;
    },
  });

  const transferring = pakReadMutation.isPending || pakWriteMutation.isPending;

  function abortFileTransfer() {
    cancelRef.current.current = 1;
  }

  function pakRead() {
    pakReadMutation.mutate();
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
      pakWriteMutation.mutate((reader.result as ArrayBuffer).slice(0, pakSize));
    };
    reader.readAsArrayBuffer(
      (document.getElementById("pakFile") as HTMLInputElement).files![0],
    );
  }

  function pakFormat() {
    pakWriteMutation.mutate(makeFormattedPak().buffer);
  }

  return (
    <>
      <WikiIntro
        url="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#71---n64-controller-pak-manager-page"
        label="7.1 - N64 controller pak manager page"
      />

      {connected && !transferring && (
        <div id="divFileSelect" style={{ marginBottom: "1em" }}>
          Select BlueRetro controller pak bank:
          <select
            id="pakSelect"
            value={pak}
            onChange={(e) => setPak(Number(e.target.value))}
          >
            <option value="0">Pak 1</option>
            <option value="1">Pak 2</option>
            <option value="2">Pak 3</option>
            <option value="3">Pak 4</option>
          </select>
          <br />
          <br />
          <button id="btnPakRead" onClick={pakRead}>
            Read
          </button>
          <br />
          <br />
          <button id="btnPakFormat" onClick={pakFormat}>
            Format
          </button>
          <br />
          <br />
          <button id="btnPakWrite" onClick={pakWrite}>
            Write
          </button>
          Select .MPK file to write:
          <input type="file" id="pakFile" />
          <br />
          <br />
          Use{" "}
          <a href="https://bryc.github.io/mempak" target="_blank">
            https://bryc.github.io/mempak
          </a>{" "}
          (by{" "}
          <a href="https://github.com/bryc" target="_blank">
            bryc
          </a>{" "}
          ) to manage content of .MPK files.
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

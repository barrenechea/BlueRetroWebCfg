import { useEffect, useRef, useState } from "react";

import { useBlueRetro } from "../components/BlueRetroContext";
import { ProgressBar } from "../components/ProgressBar";
import { WikiIntro } from "../components/WikiIntro";
import { getStringCmd } from "../lib/blueretro/getStringCmd";
import { otaWriteFirmware } from "../lib/blueretro/otaWriteFirmware";
import { cfg_cmd_get_fw_name } from "../lib/constants";
import { log } from "../lib/logger";
import { resetProgress, setProgress, showProgressBar } from "../lib/progress";
import type { CancelRef } from "../lib/types";

export function Ota() {
  const { connected, info, serviceRef } = useBlueRetro();
  const [updating, setUpdating] = useState(false);
  const [fwIsHw2, setFwIsHw2] = useState(0);
  // Real ref object so the recursive writer's cancel check works (the old
  // code passed a plain number, which made Cancel a no-op).
  const cancelRef = useRef<CancelRef>({ current: 0 });

  useEffect(() => {
    if (!connected || !info) return;
    void (async () => {
      const appVer = info.appVer;
      const appVerIs18x = appVer.indexOf("v1.8") != -1;
      const appVerBogus = appVer.indexOf("v") == -1;
      let appName = "";
      if (!appVerIs18x && !appVerBogus) {
        appName = await getStringCmd(serviceRef.current!, cfg_cmd_get_fw_name);
      }
      const appVerIsHw2 = appVer.indexOf("hw2") != -1;
      const appNameIsHw2 = appName.indexOf("hw2") != -1;
      log(
        "app_ver_is_hw2: " + appVerIsHw2 + " app_name_is_hw2: " + appNameIsHw2,
      );
      setFwIsHw2(appVerIsHw2 || appNameIsHw2 ? 1 : 0);
    })();
  }, [connected, info, serviceRef]);

  function abortFwUpdate() {
    cancelRef.current.current = 1;
  }

  function firmwareUpdate() {
    resetProgress();
    const reader = new FileReader();
    reader.onerror = () => {
      log("An error occurred reading this file.");
    };
    reader.onabort = function () {
      log("File read cancelled");
    };
    reader.onload = function () {
      const decoder = new TextDecoder("utf-8");
      const header = decoder.decode(
        (reader.result as ArrayBuffer).slice(0, 256),
      );
      const new_fw_is_hw2 = header.indexOf("hw2") != -1;
      log("new_fw_is_hw2: " + new_fw_is_hw2);
      if (fwIsHw2 == Number(new_fw_is_hw2)) {
        showProgressBar();
        setUpdating(true);
        otaWriteFirmware(
          serviceRef.current!,
          reader.result as ArrayBuffer,
          setProgress,
          cancelRef.current,
        )
          .then(() => {
            cancelRef.current.current = 0;
          })
          .catch((error) => {
            log("Argh! " + error);
            cancelRef.current.current = 0;
          })
          .finally(() => {
            setUpdating(false);
          });
      } else {
        log("Hardware and firmware mismatch!");
      }
    };

    const file = (document.getElementById("fwFile") as HTMLInputElement).value;
    const ext = file.match(/\.[0-9a-z]+$/i);

    if (ext && ext[0] == ".bin") {
      reader.readAsArrayBuffer(
        (document.getElementById("fwFile") as HTMLInputElement).files![0],
      );
    } else {
      log("Invalid file format. Make sure to unzip the archive!");
    }
  }

  return (
    <>
      <WikiIntro
        url="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#5---ota-fw-update-page"
        label="5 - OTA FW update page"
      />

      {connected && !updating && (
        <div id="divFwSelect" style={{ marginBottom: "1em" }}>
          Select firmware:
          <input type="file" id="fwFile" name="fw.bin" />
          <br />
          <button id="btnFwUpdate" onClick={firmwareUpdate}>
            Update Firmware
          </button>
        </div>
      )}
      {updating && (
        <div id="divFwUpdate" style={{ marginBottom: "1em" }}>
          <ProgressBar />
          <button id="btnFwUpdateCancel" onClick={abortFwUpdate}>
            Cancel
          </button>
        </div>
      )}
    </>
  );
}

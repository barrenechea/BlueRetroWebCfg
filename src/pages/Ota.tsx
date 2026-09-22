import { useRef, useState } from "react";

import { ConnectButton } from "../components/ConnectButton";
import { DivInfo } from "../components/DivInfo";
import { OutputPanel } from "../components/OutputPanel";
import { PageLayout } from "../components/PageLayout";
import { ProgressBar } from "../components/ProgressBar";
import { WikiIntro } from "../components/WikiIntro";
import { getAppVersion } from "../lib/blueretro/getAppVersion";
import { getBdAddr } from "../lib/blueretro/getBdAddr";
import { getLatestRelease } from "../lib/blueretro/getLatestRelease";
import { getStringCmd } from "../lib/blueretro/getStringCmd";
import { isWebBluetoothEnabled } from "../lib/blueretro/isWebBluetoothEnabled";
import { otaWriteFirmware } from "../lib/blueretro/otaWriteFirmware";
import { cfg_cmd_get_fw_name } from "../lib/constants";
import { ChromeSamples, log } from "../lib/logger";
import { resetProgress, setProgress, showProgressBar } from "../lib/progress";
import type { CancelRef } from "../lib/types";
import {
  isNotFoundError,
  useBlueRetroConnection,
} from "../lib/useBlueRetroConnection";

export function Ota() {
  const { connected, setConnected, info, setInfo, serviceRef, connect } =
    useBlueRetroConnection();
  const [updating, setUpdating] = useState(false);
  const [fwIsHw2, setFwIsHw2] = useState(0);
  // Real ref object so the recursive writer's cancel check works (the old
  // code passed a plain number, which made Cancel a no-op).
  const cancelRef = useRef<CancelRef>({ current: 0 });

  function abortFwUpdate() {
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
      const app_ver_is_18x = app_ver.indexOf("v1.8") != -1;
      const app_ver_bogus = app_ver.indexOf("v") == -1;
      let app_name = "";
      if (app_ver_is_18x || app_ver_bogus) {
        app_name = "";
      } else {
        app_name = await getStringCmd(conn.service, cfg_cmd_get_fw_name);
      }
      setInfo({
        name: conn.device.name ?? "",
        bdaddr,
        appVer: app_ver,
        latestVer: latest_ver,
      });
      const app_ver_is_hw2 = app_ver.indexOf("hw2") != -1;
      const app_name_is_hw2 = app_name.indexOf("hw2") != -1;
      log(
        "app_ver_is_hw2: " +
          app_ver_is_hw2 +
          " app_name_is_hw2: " +
          app_name_is_hw2,
      );
      setFwIsHw2(app_ver_is_hw2 || app_name_is_hw2 ? 1 : 0);
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
    <PageLayout title="BlueRetro OTA FW update">
      <WikiIntro
        url="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#5---ota-fw-update-page"
        label="5 - OTA FW update page"
      />

      <ConnectButton
        hint="Disconnect all controllers from BlueRetro before connecting for update."
        onClick={btConn}
      />
      {info && <DivInfo {...info} />}
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

      <OutputPanel />
    </PageLayout>
  );
}

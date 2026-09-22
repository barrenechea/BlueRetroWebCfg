import { useState } from "react";

import { ConnectButton } from "../components/ConnectButton";
import { DivInfo } from "../components/DivInfo";
import { OutputPanel } from "../components/OutputPanel";
import { PageLayout } from "../components/PageLayout";
import { WikiIntro } from "../components/WikiIntro";
import { getAppVersion } from "../lib/blueretro/getAppVersion";
import { getBdAddr } from "../lib/blueretro/getBdAddr";
import { getGameName } from "../lib/blueretro/getGameName";
import { getLatestRelease } from "../lib/blueretro/getLatestRelease";
import { isWebBluetoothEnabled } from "../lib/blueretro/isWebBluetoothEnabled";
import {
  brUuid,
  cfg_cmd_open_dir,
  cfg_cmd_get_file,
  cfg_cmd_close_dir,
  cfg_cmd_del_file,
} from "../lib/constants";
import { log } from "../lib/logger";
import {
  isNotFoundError,
  useBlueRetroConnection,
} from "../lib/useBlueRetroConnection";

interface FileEntry {
  name: string;
  gameId: string | undefined;
}

export function Files() {
  const { connected, setConnected, info, setInfo, serviceRef, connect } =
    useBlueRetroConnection();
  const [files, setFiles] = useState<FileEntry[]>([]);

  async function getFiles(service: BluetoothRemoteGATTService) {
    const fileList: FileEntry[] = [];
    const cmd = new Uint8Array(1);
    const cmd_chrc = await service.getCharacteristic(brUuid[7]);
    cmd[0] = cfg_cmd_open_dir;
    await cmd_chrc.writeValue(cmd);
    cmd[0] = cfg_cmd_get_file;
    await cmd_chrc.writeValue(cmd);
    for (;;) {
      const value = await cmd_chrc.readValue();
      if (value.byteLength > 0) {
        let enc = new TextDecoder("utf-8");
        let filename = enc.decode(value);
        const gamename = await getGameName(filename);
        fileList.push({ name: filename, gameId: gamename });
      } else {
        break;
      }
    }
    cmd[0] = cfg_cmd_close_dir;
    await cmd_chrc.writeValue(cmd);
    return fileList;
  }

  async function btConn() {
    if (!isWebBluetoothEnabled()) return;
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
      const fileList = await getFiles(conn.service);
      setFiles(fileList);
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

  async function deleteFile(filename: string) {
    const cmd = new Uint8Array(1);
    cmd[0] = cfg_cmd_del_file;
    const enc = new TextEncoder();
    const file = enc.encode(filename);
    const combined = new Uint8Array([...cmd, ...file]);
    setFiles(files.filter((f) => f.name !== filename));
    const chrc = await serviceRef.current!.getCharacteristic(brUuid[7]);
    await chrc.writeValue(combined);
  }

  return (
    <PageLayout title="BlueRetro Files Manager">
      <WikiIntro
        url="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#6---files-manager-page"
        label="6 - Files Manager page"
      />

      <ConnectButton
        hint="Disconnect all controllers from BlueRetro before connecting for update."
        onClick={btConn}
      />
      {info && <DivInfo {...info} />}
      {connected && (
        <div id="divFile" style={{ marginBottom: "1em" }}>
          <h2 style={{ margin: 0 }}>Files list</h2>
          {files.map((f, i) => (
            <div key={i} title={f.gameId}>
              <button id={String(i)} onClick={() => deleteFile(f.name)}>
                Delete
              </button>
              {" " + f.name}
            </div>
          ))}
        </div>
      )}

      <OutputPanel />
    </PageLayout>
  );
}

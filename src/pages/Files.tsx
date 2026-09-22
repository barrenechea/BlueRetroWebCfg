import { useEffect, useState } from "react";

import { useBlueRetro } from "../components/BlueRetroContext";
import { WikiIntro } from "../components/WikiIntro";
import { getGameName } from "../lib/blueretro/getGameName";
import {
  brUuid,
  cfg_cmd_open_dir,
  cfg_cmd_get_file,
  cfg_cmd_close_dir,
  cfg_cmd_del_file,
} from "../lib/constants";
import { log } from "../lib/logger";

interface FileEntry {
  name: string;
  gameId: string | undefined;
}

export function Files() {
  const { connected, serviceRef } = useBlueRetro();
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

  useEffect(() => {
    if (!connected) return;
    void (async () => {
      try {
        setFiles(await getFiles(serviceRef.current!));
      } catch (error) {
        log("Argh! " + error);
      }
    })();
  }, [connected, serviceRef]);

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
    <>
      <WikiIntro
        url="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#6---files-manager-page"
        label="6 - Files Manager page"
      />

      {connected && (
        <div id="divFile" style={{ marginBottom: "1em" }}>
          <h2 style={{ margin: 0 }}>Files list</h2>
          {files.map((f, i) => (
            <div key={i} title={f.gameId}>
              <button id={String(i)} onClick={() => void deleteFile(f.name)}>
                Delete
              </button>
              {" " + f.name}
            </div>
          ))}
        </div>
      )}
    </>
  );
}

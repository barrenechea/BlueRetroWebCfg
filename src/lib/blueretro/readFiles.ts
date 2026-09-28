import {
  brUuid,
  cfg_cmd_open_dir,
  cfg_cmd_get_file,
  cfg_cmd_close_dir,
} from "../constants";
import { getGameName } from "./getGameName";

export interface FileEntry {
  name: string;
  gameName: string | undefined;
}

export const readFileNames = async (
  service: BluetoothRemoteGATTService,
): Promise<string[]> => {
  const names: string[] = [];
  const cmd = new Uint8Array(1);
  const cmd_chrc = await service.getCharacteristic(brUuid[7]);
  cmd[0] = cfg_cmd_open_dir;
  await cmd_chrc.writeValue(cmd);
  cmd[0] = cfg_cmd_get_file;
  await cmd_chrc.writeValue(cmd);
  //readFileRecursive
  for (;;) {
    const value = await cmd_chrc.readValue();
    if (value.byteLength > 0) {
      names.push(new TextDecoder("utf-8").decode(value));
    } else {
      break;
    }
  }
  cmd[0] = cfg_cmd_close_dir;
  await cmd_chrc.writeValue(cmd);
  return names;
};

export const withGameNames = (names: string[]): Promise<FileEntry[]> =>
  Promise.all(
    names.map(async (name) => ({ name, gameName: await getGameName(name) })),
  );

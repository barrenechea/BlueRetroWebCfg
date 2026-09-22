import { brUuid, pakSize } from "../constants";
import type { CancelRef, ProgressFn } from "../types";
import n64ReadFileRecursive from "./n64ReadFileRecursive";

export const n64ReadFile = async (
  brService: BluetoothRemoteGATTService,
  pak: number,
  setProgress: ProgressFn,
  cancel: CancelRef,
): Promise<Uint8Array> => {
  const data = new Uint8Array(pakSize);
  const offset = new Uint32Array(1);
  const ctrl_chrc = await brService.getCharacteristic(brUuid[10]);
  offset[0] = Number(pak) * pakSize;
  await ctrl_chrc.writeValue(offset);
  const chrc = await brService.getCharacteristic(brUuid[11]);
  await n64ReadFileRecursive(chrc, data, 0, setProgress, cancel);
  offset[0] = 0;
  await ctrl_chrc.writeValue(offset);
  return data;
};

export default n64ReadFile;

import { brUuid, vmuSize } from "../constants";
import type { CancelRef, ProgressFn } from "../types";
import dcReadFileRecursive from "./dcReadFileRecursive";

export const dcReadFile = async (
  brService: BluetoothRemoteGATTService,
  setProgress: ProgressFn,
  cancel: CancelRef,
): Promise<Uint8Array> => {
  const data = new Uint8Array(vmuSize);
  const offset = new Uint32Array(1);
  const ctrl_chrc = await brService.getCharacteristic(brUuid[10]);
  offset[0] = 0;
  await ctrl_chrc.writeValue(offset);
  const chrc = await brService.getCharacteristic(brUuid[11]);
  await dcReadFileRecursive(chrc, data, 0, setProgress, cancel);
  offset[0] = 0;
  await ctrl_chrc.writeValue(offset);
  return data;
};

export default dcReadFile;

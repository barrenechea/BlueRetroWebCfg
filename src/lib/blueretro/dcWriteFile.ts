import { brUuid } from "../constants";
import type { CancelRef, ProgressFn } from "../types";
import dcWriteRecursive from "./dcWriteRecursive";

export const dcWriteFile = async (
  brService: BluetoothRemoteGATTService,
  data: ArrayBuffer,
  setProgress: ProgressFn,
  cancel: CancelRef,
): Promise<void> => {
  const offset = new Uint32Array(1);
  const ctrl_chrc = await brService.getCharacteristic(brUuid[10]);
  offset[0] = 0;
  await ctrl_chrc.writeValue(offset);
  const chrc = await brService.getCharacteristic(brUuid[11]);
  await dcWriteRecursive(chrc, data, 0, setProgress, cancel);
  offset[0] = 0;
  await ctrl_chrc.writeValue(offset);
};

export default dcWriteFile;

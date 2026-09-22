import { brUuid, pakSize } from "../constants";
import type { CancelRef, ProgressFn } from "../types";
import n64WriteRecursive from "./n64WriteRecursive";

export const n64WriteFile = async (
  brService: BluetoothRemoteGATTService,
  data: ArrayBuffer,
  pak: number,
  setProgress: ProgressFn,
  cancel: CancelRef,
): Promise<void> => {
  const offset = new Uint32Array(1);
  const ctrl_chrc = await brService.getCharacteristic(brUuid[10]);
  offset[0] = Number(pak) * pakSize;
  await ctrl_chrc.writeValue(offset);
  const chrc = await brService.getCharacteristic(brUuid[11]);
  await n64WriteRecursive(chrc, data, 0, setProgress, cancel);
  offset[0] = 0;
  await ctrl_chrc.writeValue(offset);
};

export default n64WriteFile;

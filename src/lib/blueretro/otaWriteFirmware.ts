import {
  brUuid,
  cfg_cmd_ota_abort,
  cfg_cmd_ota_end,
  cfg_cmd_ota_start,
} from "../constants";
import type { CancelRef, ProgressFn } from "../types";
import otaWriteFwRecursive from "./otaWriteFwRecursive";

export const otaWriteFirmware = async (
  brService: BluetoothRemoteGATTService,
  data: ArrayBuffer,
  setProgress: ProgressFn,
  cancel: CancelRef,
): Promise<void> => {
  const cmd = new Uint8Array(1);
  const ctrl_chrc = await brService.getCharacteristic(brUuid[7]);
  cmd[0] = cfg_cmd_ota_start;
  await ctrl_chrc.writeValue(cmd);
  const chrc = await brService.getCharacteristic(brUuid[8]);
  try {
    await otaWriteFwRecursive(chrc, data, 0, setProgress, cancel);
    cmd[0] = cfg_cmd_ota_end;
    await ctrl_chrc.writeValue(cmd);
  } catch (error) {
    cmd[0] = cfg_cmd_ota_abort;
    await ctrl_chrc.writeValue(cmd);
    throw error;
  }
};

export default otaWriteFirmware;

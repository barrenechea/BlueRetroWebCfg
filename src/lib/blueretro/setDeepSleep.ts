import { brUuid, cfg_cmd_sys_deep_sleep } from "../constants";
import { ChromeSamples } from "../logger";

export async function setDeepSleep(brService: BluetoothRemoteGATTService) {
  const cmd = new Uint8Array(1);
  let ctrl_chrc!: BluetoothRemoteGATTCharacteristic;
  try {
    ctrl_chrc = await brService.getCharacteristic(brUuid[7]);
    cmd[0] = cfg_cmd_sys_deep_sleep;
    await ctrl_chrc.writeValue(cmd);
  } catch (error) {
    ChromeSamples.log("Argh! " + error);
    await ctrl_chrc.writeValue(cmd);
  }
}

export default setDeepSleep;

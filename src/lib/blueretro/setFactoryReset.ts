import { brUuid, cfg_cmd_sys_factory } from "../constants";
import { ChromeSamples } from "../logger";

export async function setFactoryReset(brService: BluetoothRemoteGATTService) {
  const cmd = new Uint8Array(1);
  let ctrl_chrc!: BluetoothRemoteGATTCharacteristic;
  try {
    ctrl_chrc = await brService.getCharacteristic(brUuid[7]);
    cmd[0] = cfg_cmd_sys_factory;
    await ctrl_chrc.writeValue(cmd);
  } catch (error) {
    ChromeSamples.log("Argh! " + error);
    await ctrl_chrc.writeValue(cmd);
  }
}

export default setFactoryReset;

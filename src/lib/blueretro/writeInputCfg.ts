import { brUuid } from "../constants";
import presetWriteRecursive from "./presetWriteRecursive";

export const writeInputCfg = async (
  cfgId: number,
  cfg: Uint8Array<ArrayBuffer>,
  brService: BluetoothRemoteGATTService,
): Promise<Uint8Array<ArrayBuffer>> => {
  const ctrl_chrc = await brService.getCharacteristic(brUuid[4]);
  const data_chrc = await brService.getCharacteristic(brUuid[5]);
  const inputCtrl = new Uint16Array(2);
  inputCtrl[0] = Number(cfgId);
  inputCtrl[1] = 0;
  await presetWriteRecursive(cfg, inputCtrl, ctrl_chrc, data_chrc);
  return cfg;
};

export default writeInputCfg;

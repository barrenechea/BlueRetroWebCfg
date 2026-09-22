import { brUuid } from "../constants";

export const saveGlobalCfg = async (
  brService: BluetoothRemoteGATTService,
  globalCfg: Uint8Array<ArrayBuffer>,
): Promise<void> => {
  const chrc = await brService.getCharacteristic(brUuid[1]);
  await chrc.writeValue(globalCfg);
};

export default saveGlobalCfg;

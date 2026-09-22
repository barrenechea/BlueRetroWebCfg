import { brUuid } from "../constants";
import { ChromeSamples } from "../logger";

export const saveOutputCfg = async (
  brService: BluetoothRemoteGATTService,
  data: Uint8Array<ArrayBuffer>,
  cfgId: string,
): Promise<void> => {
  ChromeSamples.log("Get Output " + cfgId + " CTRL CHRC...");
  const chrc = await brService.getCharacteristic(brUuid[2]);
  ChromeSamples.log("Set Output " + cfgId + " on CTRL chrc...");
  const outputCtrl = new Uint16Array(1);
  outputCtrl[0] = Number(cfgId);
  await chrc.writeValue(outputCtrl);
  ChromeSamples.log("Get Output " + cfgId + " DATA CHRC...");
  const dataChrc = await brService.getCharacteristic(brUuid[3]);
  ChromeSamples.log("Writing Output " + cfgId + " Config...");
  await dataChrc.writeValue(data);
};

export default saveOutputCfg;

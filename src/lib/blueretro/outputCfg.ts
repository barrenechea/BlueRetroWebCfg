import { brUuid } from "../constants";
import { log } from "../logger";

export interface OutputCfg {
  mode: number;
  acc: number;
}

export const readOutputCfg = async (
  service: BluetoothRemoteGATTService,
  cfgId: number,
): Promise<OutputCfg> => {
  log("Get Output " + cfgId + " CTRL CHRC...");
  const chrc = await service.getCharacteristic(brUuid[2]);
  log("Set Output " + cfgId + " on CTRL chrc...");
  const outputCtrl = new Uint16Array(1);
  outputCtrl[0] = Number(cfgId);
  await chrc.writeValue(outputCtrl);
  log("Get Output " + cfgId + " DATA CHRC...");
  const dataChrc = await service.getCharacteristic(brUuid[3]);
  log("Reading Output " + cfgId + " Config...");
  const value = await dataChrc.readValue();
  log("Output " + cfgId + " Config size: " + value.byteLength);
  return { mode: value.getUint8(0), acc: value.getUint8(1) };
};

export const encodeOutputCfg = (cfg: OutputCfg): Uint8Array<ArrayBuffer> =>
  new Uint8Array([cfg.mode, cfg.acc]);

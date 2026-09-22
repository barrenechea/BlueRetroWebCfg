import { brUuid } from "../constants";
import { ChromeSamples } from "../logger";

export const getGlobalCfg = async (
  service: BluetoothRemoteGATTService,
  apiver: number,
): Promise<Uint8Array> => {
  if (apiver === -1) {
    throw new Error("failed to get API version");
  }
  const chrc = await service.getCharacteristic(brUuid[1]);
  ChromeSamples.log("Reading Global Config...");
  const value = await chrc.readValue();
  ChromeSamples.log("Global Config size: " + value.byteLength);
  let temp = new Uint8Array(2);

  if (apiver > 0) {
    temp = new Uint8Array(3);
  }
  if (apiver > 1) {
    temp = new Uint8Array(4);
  }

  temp[0] = value.getUint8(0);
  temp[1] = value.getUint8(1);
  if (apiver > 0) {
    temp[2] = value.getUint8(2);
  }
  if (apiver > 1) {
    temp[3] = value.getUint8(3);
  }
  return temp;
};

export default getGlobalCfg;

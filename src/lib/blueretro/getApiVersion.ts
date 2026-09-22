import { brUuid } from "../constants";
import { ChromeSamples } from "../logger";

export const getApiVersion = async (
  service: BluetoothRemoteGATTService,
): Promise<number> => {
  ChromeSamples.log("Reading Api version...");
  const chrc = await service.getCharacteristic(brUuid[6]);
  const value = await chrc.readValue();
  return value.getUint8(0);
};

export default getApiVersion;

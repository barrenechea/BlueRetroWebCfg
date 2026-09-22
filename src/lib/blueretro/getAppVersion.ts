import { brUuid } from "../constants";
import { ChromeSamples } from "../logger";

export const getAppVersion = async (
  service: BluetoothRemoteGATTService,
): Promise<string> => {
  const chrc = await service.getCharacteristic(brUuid[9]);
  ChromeSamples.log("Reading App version...");
  const value = await chrc.readValue();
  let app_ver = new TextDecoder("utf-8").decode(value);
  return app_ver;
};

export default getAppVersion;

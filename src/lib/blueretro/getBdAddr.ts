import { brUuid } from "../constants";

export const getBdAddr = async (
  service: BluetoothRemoteGATTService,
): Promise<string> => {
  const chrc = await service.getCharacteristic(brUuid[12]);
  const value = await chrc.readValue();
  const bdaddr =
    value.getUint8(5).toString(16).padStart(2, "0") +
    ":" +
    value.getUint8(4).toString(16).padStart(2, "0") +
    ":" +
    value.getUint8(3).toString(16).padStart(2, "0") +
    ":" +
    value.getUint8(2).toString(16).padStart(2, "0") +
    ":" +
    value.getUint8(1).toString(16).padStart(2, "0") +
    ":" +
    value.getUint8(0).toString(16).padStart(2, "0");
  return bdaddr;
};

export default getBdAddr;

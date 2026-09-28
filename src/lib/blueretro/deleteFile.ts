import { brUuid, cfg_cmd_del_file } from "../constants";

export const deleteFile = async (
  service: BluetoothRemoteGATTService,
  filename: string,
): Promise<void> => {
  const cmd = new Uint8Array([cfg_cmd_del_file]);
  const file = new TextEncoder().encode(filename);
  const chrc = await service.getCharacteristic(brUuid[7]);
  await chrc.writeValue(new Uint8Array([...cmd, ...file]));
};

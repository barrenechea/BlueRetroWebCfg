import { brUuid, cfg_cmd_get_cfg_src } from "../constants";

export const getCfgSrc = async (
  service: BluetoothRemoteGATTService,
): Promise<number> => {
  const cmd = new Uint8Array(1);
  const cmd_chrc = await service.getCharacteristic(brUuid[7]);
  cmd[0] = cfg_cmd_get_cfg_src;
  await cmd_chrc.writeValue(cmd);
  const value = await cmd_chrc.readValue();
  return value.getUint8(0);
};

export default getCfgSrc;

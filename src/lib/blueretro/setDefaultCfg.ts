import { brUuid, cfg_cmd_set_default_cfg } from "../constants";

export const setDefaultCfg = async (
  service: BluetoothRemoteGATTService,
): Promise<void> => {
  const cmd = new Uint8Array(1);
  const chrc = await service.getCharacteristic(brUuid[7]);
  cmd[0] = cfg_cmd_set_default_cfg;
  await chrc.writeValue(cmd);
};

export default setDefaultCfg;

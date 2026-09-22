import { brUuid, cfg_cmd_set_gameid_cfg } from "../constants";

export const setGameIdCfg = async (
  service: BluetoothRemoteGATTService,
): Promise<void> => {
  const cmd = new Uint8Array(1);
  const chrc = await service.getCharacteristic(brUuid[7]);
  cmd[0] = cfg_cmd_set_gameid_cfg;
  await chrc.writeValue(cmd);
};

export default setGameIdCfg;

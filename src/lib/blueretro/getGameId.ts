import { brUuid, cfg_cmd_get_gameid } from "../constants";

export const getGameId = async (
  service: BluetoothRemoteGATTService,
): Promise<string> => {
  const cmd = new Uint8Array(1);
  const cmd_chrc = await service.getCharacteristic(brUuid[7]);
  cmd[0] = cfg_cmd_get_gameid;
  await cmd_chrc.writeValue(cmd);
  const value = await cmd_chrc.readValue();
  let enc = new TextDecoder("utf-8");
  let gameid = enc.decode(value).replace(/[^0-9a-z_-]/gi, "");
  return gameid;
};

export default getGameId;

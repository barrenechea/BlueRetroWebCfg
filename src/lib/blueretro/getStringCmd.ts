import { brUuid } from "../constants";

export const getStringCmd = async (
  service: BluetoothRemoteGATTService,
  command: number,
): Promise<string> => {
  const cmd = new Uint8Array(1);
  const cmd_chrc = await service.getCharacteristic(brUuid[7]);
  cmd[0] = command;
  await cmd_chrc.writeValue(cmd);
  const value = await cmd_chrc.readValue();
  let enc = new TextDecoder("utf-8");
  let string = enc.decode(value);
  return string;
};

export default getStringCmd;

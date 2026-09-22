import { btn } from "../constants";
import { ChromeSamples } from "../logger";
import type { Preset } from "../types";
import writeInputCfg from "./writeInputCfg";

export function savePresetInput(
  preset: Preset,
  brService: BluetoothRemoteGATTService,
  input: number,
): Promise<void> {
  const nbMapping = preset.map.length;
  const cfgSize = nbMapping * 8 + 3;
  const cfg = new Uint8Array(cfgSize);
  const cfgId = input;
  let j = 0;
  cfg[j++] = 0;
  cfg[j++] = 0;
  cfg[j++] = nbMapping;
  for (let i = 0; i < nbMapping; i++) {
    cfg[j++] = btn[preset.map[i][0]];
    cfg[j++] = btn[preset.map[i][1]];
    cfg[j++] = preset.map[i][2] + cfgId;
    cfg[j++] = preset.map[i][3];
    cfg[j++] = preset.map[i][4];
    cfg[j++] = preset.map[i][5];
    cfg[j++] = preset.map[i][6];
    cfg[j++] = Number(preset.map[i][7]) | (Number(preset.map[i][8]) << 4);
  }

  return writeInputCfg(cfgId, cfg, brService).then(() => {
    ChromeSamples.log("Input " + cfgId + " Config saved");
  });
}

export default savePresetInput;

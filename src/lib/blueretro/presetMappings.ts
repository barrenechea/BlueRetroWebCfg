import { btn } from "../constants";
import type { Preset } from "../types";
import type { MappingRow } from "./inputCfg";

/** A preset's mappings for one input, with destinations offset to its output. */
export const presetMappings = (preset: Preset, cfgId: number): MappingRow[] =>
  preset.map.map(
    ([src, dest, destId, max, thres, dz, turbo, scaling, diag]) => ({
      src: btn[src],
      dest: btn[dest],
      destId: destId + cfgId,
      max,
      thres,
      dz,
      turbo,
      scaling,
      diag,
    }),
  );

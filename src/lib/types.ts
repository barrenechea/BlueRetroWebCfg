/** A mutable cancel flag shared between a transfer and its Cancel button. */
export type CancelRef = { current: number };

export type ProgressFn = (percent: number) => void;

/** One entry of a preset `map`: [src, dest, destId, max, thres, dz, turbo, scaling, diag]. */
export type PresetMapEntry = [
  string,
  string,
  number,
  number,
  number,
  number,
  number,
  number,
  number,
];

export interface Preset {
  name: string;
  desc: string;
  console: string;
  map: PresetMapEntry[];
}

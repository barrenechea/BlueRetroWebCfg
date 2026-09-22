import type { Preset } from "./types";

// Bundled at build time in the same lexicographic order the old site's
// runtime listing had, so preset indices stay stable.
const modules = import.meta.glob("../map/*.json", { eager: true }) as Record<
  string,
  { default: Preset }
>;

export const presets: Preset[] = Object.keys(modules)
  .sort()
  .map((key) => modules[key].default);

// Unique consoles, first-occurrence order.
export const consoles: string[] = [...new Set(presets.map((p) => p.console))];

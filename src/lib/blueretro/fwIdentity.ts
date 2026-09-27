// Identify which hardware revision and console a BlueRetro firmware targets.
//
// The adapter can only tell us its (truncated) project name over BLE. For a
// .bin we look at the machine code itself instead, so renamed files and
// vendored builds (whose project name is just "BlueRetro") are still
// identified.

// ESP-IDF app images embed an esp_app_desc_t right after the 24-byte image
// header and the first 8-byte segment header.
const IMAGE_HEADER_SIZE = 24;
const APP_DESC_OFFSET = 32;
const APP_DESC_MAGIC = 0xabcd5432;
const IMAGE_MAGIC = 0xe9;
// The adapter only returns the first 23 bytes of its project name and
// version over BLE (see bt_att_cfg_cmd_fw_name_rsp in the firmware).
const ADAPTER_STRING_MAX = 23;

// Log strings compiled into the firmware (main/main.c, system/manager.c).
// Present in every build:
const BLUERETRO_MARKER = "# Config override system : %d: %s";
// Only in builds with a compile-time system (every build but universal):
const HARDCODED_SYS_MARKER = "# Hardcoded system : %d: %s";
// Only in CONFIG_BLUERETRO_HW2 code:
const HW2_MARKER = /# %s: BTDEV %l?d map to WIRED/;

// wired system ids, from the enum in main/adapter/adapter.h.
const systemLabels: Record<number, string> = {
  0: "Universal",
  1: "Parallel 1P",
  2: "Parallel 2P",
  3: "NES",
  4: "PC Engine",
  5: "Genesis",
  6: "SNES",
  7: "CD-i",
  8: "CD32",
  9: "3DO",
  10: "Jaguar",
  11: "PlayStation",
  12: "Saturn",
  13: "PC-FX",
  14: "JVS Arcade",
  15: "N64",
  16: "Dreamcast",
  17: "PlayStation",
  18: "GameCube",
  19: "Wii Extension",
  20: "Virtual Boy",
  21: "Parallel 1P (3.3V)",
  22: "Parallel 2P (3.3V)",
  23: "GBA HD",
};

// Release build names ("BlueRetro_<hw>_<build>") to the system id they
// hardcode, as the adapter only reports its name.
const buildSystems: Record<string, number> = {
  "3do": 9,
  cdi: 7,
  dreamcast: 16,
  gamecube: 18,
  gbahd: 23,
  genesis: 5,
  ibluecontrol_snes: 6,
  jaguar: 10,
  jvs_arcade: 14,
  n64: 15,
  nes: 3,
  parallel_1p: 1,
  parallel_1p_3v3: 21,
  parallel_2p: 2,
  parallel_2p_3v3: 22,
  pc_engine: 4,
  pcfx: 13,
  playstation: 17,
  saturn: 12,
  snes: 6,
  universal: 0,
  virtualboy: 20,
  wii_extension: 19,
};

export interface FwIdentity {
  // "hw1" / "hw2", or null when unknown.
  hardware: string | null;
  // Every system id the firmware could target: one when known, several when
  // the adapter's truncated name is ambiguous, none when unknown.
  systems: number[];
}

export interface FwImage {
  version: string;
  projectName: string;
  identity: FwIdentity;
}

function readCString(bytes: Uint8Array, offset: number, length: number) {
  const field = bytes.subarray(offset, offset + length);
  const end = field.indexOf(0);
  return new TextDecoder("utf-8").decode(
    end == -1 ? field : field.subarray(0, end),
  );
}

interface Segment {
  addr: number;
  offset: number;
  length: number;
}

function readSegments(view: DataView): Segment[] | null {
  if (view.byteLength < IMAGE_HEADER_SIZE) return null;
  if (view.getUint8(0) != IMAGE_MAGIC) return null;
  const segments: Segment[] = [];
  let offset = IMAGE_HEADER_SIZE;
  for (let i = 0; i < view.getUint8(1); i++) {
    if (offset + 8 > view.byteLength) return null;
    const addr = view.getUint32(offset, true);
    const length = view.getUint32(offset + 4, true);
    offset += 8;
    if (offset + length > view.byteLength) return null;
    segments.push({ addr, offset, length });
    offset += length;
  }
  return segments;
}

function isCode(segment: Segment) {
  return segment.addr >= 0x40000000 && segment.addr < 0x40400000;
}

// Finds `wired_adapter.system_id = HARDCODED_SYS;` in main.c, which the
// compiler emits right before loading the "# Hardcoded system" log string:
//   movi[.n] aT, <id>
//   s32i[.n] aT, aS, 0
//   ...
//   l32r     aX, <literal holding the string's address>
function readHardcodedSystem(
  bytes: Uint8Array,
  view: DataView,
  segments: Segment[],
  stringOffset: number,
): number | null {
  const stringSegment = segments.find(
    (s) => stringOffset >= s.offset && stringOffset < s.offset + s.length,
  );
  if (!stringSegment) return null;
  const stringAddr = stringSegment.addr + stringOffset - stringSegment.offset;

  const literals = new Set<number>();
  for (const s of segments) {
    for (let i = s.offset; i + 4 <= s.offset + s.length; i++) {
      if (view.getUint32(i, true) == stringAddr) {
        literals.add(s.addr + i - s.offset);
      }
    }
  }
  if (literals.size == 0) return null;

  const found = new Set<number>();
  for (const s of segments.filter(isCode)) {
    for (let i = s.offset; i + 3 <= s.offset + s.length; i++) {
      // l32r at, label: op0 = 1, 16-bit negative word offset.
      if ((bytes[i] & 0x0f) != 1) continue;
      const pc = s.addr + i - s.offset;
      const imm = bytes[i + 1] | (bytes[i + 2] << 8);
      const target = ((pc + 3) & ~3) + ((imm - 0x10000) << 2);
      if (!literals.has(target)) continue;
      const id = findSystemStore(bytes, i);
      if (id !== null) found.add(id);
    }
  }
  return found.size == 1 ? [...found][0] : null;
}

// Looks backwards from `end` for a constant stored to memory.
function findSystemStore(bytes: Uint8Array, end: number): number | null {
  for (let i = end - 4; i >= Math.max(0, end - 32); i--) {
    // s32i at, as, 0 (3 bytes) or s32i.n at, as, 0 (2 bytes).
    let reg: number;
    if ((bytes[i] & 0x0f) == 2 && bytes[i + 1] >> 4 == 6 && bytes[i + 2] == 0) {
      reg = bytes[i] >> 4;
    } else if ((bytes[i] & 0x0f) == 9 && bytes[i + 1] >> 4 == 0) {
      reg = bytes[i] >> 4;
    } else {
      continue;
    }
    // movi at, imm12 (3 bytes, right before the store).
    if (
      i >= 3 &&
      bytes[i - 3] == ((reg << 4) | 2) &&
      bytes[i - 2] >> 4 == 0xa
    ) {
      return ((bytes[i - 2] & 0x0f) << 8) | bytes[i - 1];
    }
    // movi.n at, imm7 (2 bytes, right before the store).
    if (
      i >= 2 &&
      (bytes[i - 2] & 0x8f) == 0x0c &&
      (bytes[i - 1] & 0x0f) == reg
    ) {
      return ((bytes[i - 2] & 0x70) | (bytes[i - 1] >> 4)) & 0x7f;
    }
  }
  return null;
}

export const readFwImage = (data: ArrayBuffer): FwImage => {
  const bytes = new Uint8Array(data);
  const view = new DataView(data);
  let version = "";
  let projectName = "";
  if (
    data.byteLength >= APP_DESC_OFFSET + 256 &&
    view.getUint32(APP_DESC_OFFSET, true) == APP_DESC_MAGIC
  ) {
    const desc = bytes.subarray(APP_DESC_OFFSET);
    version = readCString(desc, 16, 32);
    projectName = readCString(desc, 48, 32);
  }

  const unknown = {
    version,
    projectName,
    identity: { hardware: null, systems: [] },
  };
  const segments = readSegments(view);
  // latin1 maps every byte to one char, so string offsets are byte offsets.
  const text = new TextDecoder("latin1").decode(bytes);
  if (!segments || text.indexOf(BLUERETRO_MARKER) == -1) return unknown;

  const hardware = HW2_MARKER.test(text) ? "hw2" : "hw1";
  const hardcoded = text.indexOf(HARDCODED_SYS_MARKER);
  let system: number | null = 0;
  if (hardcoded != -1) {
    system = readHardcodedSystem(bytes, view, segments, hardcoded);
  }
  return {
    version,
    projectName,
    identity: { hardware, systems: system === null ? [] : [system] },
  };
};

export const parseAdapterIdentity = (
  projectName: string,
  version: string,
): FwIdentity => {
  const name = projectName.replace(/\0/g, "").trim();
  const hardware =
    (name.match(/hw\d/i) ?? version.match(/hw\d/i))?.[0].toLowerCase() ?? null;
  const match = name.match(/^BlueRetro_hw\d_(.+)$/i);
  if (!match) return { hardware, systems: [] };
  const build = match[1].toLowerCase();
  const builds =
    name.length >= ADAPTER_STRING_MAX
      ? Object.keys(buildSystems).filter((known) => known.startsWith(build))
      : [build];
  const systems = [
    ...new Set(
      builds.filter((b) => b in buildSystems).map((b) => buildSystems[b]),
    ),
  ];
  return { hardware, systems };
};

function commonPrefix(values: string[]) {
  return values.reduce((prefix, value) => {
    let i = 0;
    while (i < prefix.length && prefix[i] == value[i]) i++;
    return prefix.slice(0, i);
  });
}

export const fwSystemLabel = (identity: FwIdentity): string | null => {
  const labels = [
    ...new Set(identity.systems.map((id) => systemLabels[id] ?? `#${id}`)),
  ];
  if (labels.length == 0) return null;
  if (labels.length == 1) return labels[0];
  return commonPrefix(labels).replace(/[\s(]+$/, "") + "…";
};

export type FwCheck = "match" | "differs" | "unknown";

export const compareHardware = (
  adapter: FwIdentity,
  file: FwIdentity,
): FwCheck => {
  if (!adapter.hardware || !file.hardware) return "unknown";
  return adapter.hardware == file.hardware ? "match" : "differs";
};

export const compareSystem = (
  adapter: FwIdentity,
  file: FwIdentity,
): FwCheck => {
  if (adapter.systems.length == 0 || file.systems.length != 1) {
    return "unknown";
  }
  if (!adapter.systems.includes(file.systems[0])) return "differs";
  // e.g. the adapter reports "parallel_" for all four parallel builds.
  return adapter.systems.length == 1 ? "match" : "unknown";
};

import { brUuid } from "../constants";
import { log } from "../logger";
import { writeInputCfg } from "./writeInputCfg";

export interface MappingRow {
  src: number;
  dest: number;
  destId: number;
  max: number;
  thres: number;
  dz: number;
  turbo: number;
  scaling: number;
  diag: number;
}

export const readInputCfg = async (
  service: BluetoothRemoteGATTService,
  cfgId: number,
): Promise<MappingRow[]> => {
  const cfg = new Uint8Array(2051);
  log("Get Input " + cfgId + " Config CHRC...");
  const ctrl_chrc = await service.getCharacteristic(brUuid[4]);
  const data_chrc = await service.getCharacteristic(brUuid[5]);
  const inputCtrl = new Uint16Array(2);
  inputCtrl[0] = Number(cfgId);
  inputCtrl[1] = 0;
  for (;;) {
    log("Set Input Ctrl CHRC... " + inputCtrl[1]);
    await ctrl_chrc.writeValue(inputCtrl);
    log("Reading Input Data CHRC...");
    const value = await data_chrc.readValue();
    log("Got Input Data " + value.byteLength);
    const tmp = new Uint8Array(value.buffer);
    cfg.set(tmp, inputCtrl[1]);
    log("Got Input Data " + cfg[2] + " " + value.getUint8(2));
    if (value.byteLength == 512) {
      inputCtrl[1] += Number(512);
    } else {
      break;
    }
  }
  log("Input " + cfgId + " Config size: " + cfg.byteLength);
  return decodeInputCfg(cfg);
};

/** A 3-byte header whose last byte is the row count, then 8 bytes per row. */
export const decodeInputCfg = (cfg: Uint8Array): MappingRow[] => {
  const rows: MappingRow[] = [];
  let j = 3;
  for (let i = 0; i < cfg[2]; i++) {
    rows.push({
      src: cfg[j++],
      dest: cfg[j++],
      destId: cfg[j++],
      max: cfg[j++],
      thres: cfg[j++],
      dz: cfg[j++],
      turbo: cfg[j++],
      scaling: cfg[j] & 0xf,
      diag: cfg[j++] >> 4,
    });
  }
  return rows;
};

/** The inverse of `decodeInputCfg`. */
export const encodeInputCfg = (rows: MappingRow[]): Uint8Array<ArrayBuffer> => {
  const cfg = new Uint8Array(rows.length * 8 + 3);
  let j = 0;
  cfg[j++] = 0;
  cfg[j++] = 0;
  cfg[j++] = rows.length;
  for (const row of rows) {
    cfg[j++] = row.src;
    cfg[j++] = row.dest;
    cfg[j++] = row.destId;
    cfg[j++] = row.max;
    cfg[j++] = row.thres;
    cfg[j++] = row.dz;
    cfg[j++] = row.turbo;
    cfg[j++] = row.scaling | (row.diag << 4);
  }
  return cfg;
};

/**
 * Writes the rows and returns them as the adapter stores them, i.e. after the
 * byte encoding (unknown buttons become 0, values wrap to a byte).
 */
export const saveInputCfg = async (
  service: BluetoothRemoteGATTService,
  cfgId: number,
  rows: MappingRow[],
): Promise<MappingRow[]> => {
  const cfg = encodeInputCfg(rows);
  await writeInputCfg(cfgId, cfg, service);
  return decodeInputCfg(cfg);
};

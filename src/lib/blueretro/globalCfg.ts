import { brUuid } from "../constants";
import { log } from "../logger";

export interface GlobalCfg {
  system: number;
  multitap: number;
  inquiry: number;
  banksel: number;
}

/** Older API versions return only the leading fields; the rest read as 0. */
export const readGlobalCfg = async (
  service: BluetoothRemoteGATTService,
): Promise<GlobalCfg> => {
  log("Get Global Config CHRC...");
  const chrc = await service.getCharacteristic(brUuid[1]);
  log("Reading Global Config...");
  const value = await chrc.readValue();
  log("Global Config size: " + value.byteLength);
  const byte = (i: number) => (i < value.byteLength ? value.getUint8(i) : 0);
  return {
    system: byte(0),
    multitap: byte(1),
    inquiry: byte(2),
    banksel: byte(3),
  };
};

/** How many leading global fields an adapter's API version knows about. */
export const globalCfgFieldCount = (apiVersion: number): number =>
  apiVersion > 1 ? 4 : apiVersion > 0 ? 3 : 2;

export const encodeGlobalCfg = (
  cfg: GlobalCfg,
  apiVersion: number,
): Uint8Array<ArrayBuffer> =>
  new Uint8Array(
    [cfg.system, cfg.multitap, cfg.inquiry, cfg.banksel].slice(
      0,
      globalCfgFieldCount(apiVersion),
    ),
  );

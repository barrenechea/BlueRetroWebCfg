import { cfg_cmd_get_fw_name } from "../constants";
import { log } from "../logger";
import { type FwIdentity, parseAdapterIdentity } from "./fwIdentity";
import { getStringCmd } from "./getStringCmd";

export interface AdapterIdentity {
  identity: FwIdentity;
  /** False when the firmware name read failed, leaving the identity unverified. */
  complete: boolean;
}

/**
 * Never throws on a missing firmware name: the identity then comes back
 * unverified, so flashing stays possible through the mismatch dialog, which
 * matters when OTA is the way to recover a misbehaving adapter.
 */
export const readAdapterIdentity = async (
  service: BluetoothRemoteGATTService,
  appVer: string,
): Promise<AdapterIdentity> => {
  const appVerIs18x = appVer.indexOf("v1.8") != -1;
  const appVerBogus = appVer.indexOf("v") == -1;
  let appName = "";
  let complete = true;
  if (!appVerIs18x && !appVerBogus) {
    try {
      appName = await getStringCmd(service, cfg_cmd_get_fw_name);
    } catch (error) {
      complete = false;
      log("Couldn't read the firmware name: " + String(error));
    }
  }
  const identity = parseAdapterIdentity(appName, appVer);
  log(
    "app_name: " +
      JSON.stringify(appName.replace(/\0/g, "")) +
      " hw: " +
      identity.hardware +
      " systems: " +
      identity.systems,
  );
  return { identity, complete };
};

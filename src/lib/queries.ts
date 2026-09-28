import {
  type QueryKey,
  type UseSuspenseQueryOptions,
  useSuspenseQuery,
} from "@tanstack/react-query";

import { useBlueRetro } from "../components/BlueRetroContext";
import { gattSerial } from "./blueretro/gattSerial";
import { readGlobalCfg } from "./blueretro/globalCfg";
import { readInputCfg } from "./blueretro/inputCfg";
import { readOutputCfg } from "./blueretro/outputCfg";
import { readAdapterIdentity } from "./blueretro/readAdapterIdentity";
import { readFileNames, withGameNames } from "./blueretro/readFiles";

/**
 * Everything under `cfg` belongs to the active config (global or GameID), so
 * switching configs resets that whole subtree.
 */
export const queryKeys = {
  cfg: ["cfg"],
  globalCfg: ["cfg", "global"],
  outputCfg: (cfgId: number) => ["cfg", "output", cfgId],
  inputCfg: (cfgId: number) => ["cfg", "input", cfgId],
  files: ["files"],
  adapterIdentity: (appVer: string) => ["adapter-identity", appVer],
} as const;

type Gatt = <R>(
  run: (service: BluetoothRemoteGATTService) => Promise<R>,
) => Promise<R>;

/**
 * Suspends on a read of the connected adapter; render it under a
 * `QueryBoundary`. Only what runs through `gatt` holds the GATT queue, so
 * slower non-GATT work can happen after it.
 */
function useGattQuery<T>(
  queryKey: QueryKey,
  queryFn: (gatt: Gatt) => Promise<T>,
  { staleTime }: Pick<UseSuspenseQueryOptions<T>, "staleTime"> = {},
) {
  const { serviceRef } = useBlueRetro();
  return useSuspenseQuery({
    queryKey,
    queryFn: () => queryFn((run) => gattSerial(() => run(serviceRef.current!))),
    staleTime,
  });
}

/**
 * Every config write goes through `mutations.ts`, which updates or resets
 * these reads (and a disconnect clears them), so they never go stale on their
 * own.
 */
const CFG_READ = { staleTime: Infinity };

export function useGlobalCfg() {
  return useGattQuery(
    queryKeys.globalCfg,
    (gatt) => gatt(readGlobalCfg),
    CFG_READ,
  );
}

export function useOutputCfg(cfgId: number) {
  return useGattQuery(
    queryKeys.outputCfg(cfgId),
    (gatt) => gatt((service) => readOutputCfg(service, cfgId)),
    CFG_READ,
  );
}

export function useInputCfg(cfgId: number) {
  return useGattQuery(
    queryKeys.inputCfg(cfgId),
    (gatt) => gatt((service) => readInputCfg(service, cfgId)),
    CFG_READ,
  );
}

export function useFiles() {
  return useGattQuery(queryKeys.files, async (gatt) =>
    withGameNames(await gatt(readFileNames)),
  );
}

/**
 * Fixed for the connection, unless the firmware name read failed: then the
 * next mount reads it again.
 */
export function useAdapterIdentity() {
  const { info } = useBlueRetro();
  const appVer = info?.appVer ?? "";
  return useGattQuery(
    queryKeys.adapterIdentity(appVer),
    (gatt) => gatt((service) => readAdapterIdentity(service, appVer)),
    { staleTime: (query) => (query.state.data?.complete ? Infinity : 0) },
  );
}

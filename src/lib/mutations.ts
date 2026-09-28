import {
  type UseMutationOptions,
  useIsMutating,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";

import { useBlueRetro } from "../components/BlueRetroContext";
import { dcReadFile } from "./blueretro/dcReadFile";
import { dcWriteFile } from "./blueretro/dcWriteFile";
import { deleteFile } from "./blueretro/deleteFile";
import { downloadFile } from "./blueretro/downloadFile";
import { gattSerial } from "./blueretro/gattSerial";
import { getCfgSrc } from "./blueretro/getCfgSrc";
import { encodeGlobalCfg, type GlobalCfg } from "./blueretro/globalCfg";
import { type MappingRow, saveInputCfg } from "./blueretro/inputCfg";
import { n64ReadFile } from "./blueretro/n64ReadFile";
import { n64WriteFile } from "./blueretro/n64WriteFile";
import { otaWriteFirmware } from "./blueretro/otaWriteFirmware";
import { encodeOutputCfg, type OutputCfg } from "./blueretro/outputCfg";
import type { FileEntry } from "./blueretro/readFiles";
import { saveGlobalCfg } from "./blueretro/saveGlobalCfg";
import { saveOutputCfg } from "./blueretro/saveOutputCfg";
import { setDeepSleep } from "./blueretro/setDeepSleep";
import { setDefaultCfg } from "./blueretro/setDefaultCfg";
import { setFactoryReset } from "./blueretro/setFactoryReset";
import { setGameIdCfg } from "./blueretro/setGameIdCfg";
import { setReset } from "./blueretro/setReset";
import { pakSize, vmuSize } from "./constants";
import { log } from "./logger";
import { setProgress } from "./progress";
import { queryKeys } from "./queries";
import type { CancelRef } from "./types";
import { isNotFoundError } from "./useBlueRetroConnection";

/**
 * Every write to a config lives under `save-cfg`, so a config switch can wait
 * for pending saves and the forms can lock while a switch is in flight.
 * Transfers are keyed so their progress survives leaving and revisiting a page.
 */
export const mutationKeys = {
  saveCfg: ["save-cfg"],
  saveGlobalCfg: ["save-cfg", "global"],
  saveOutputCfg: ["save-cfg", "output"],
  saveInputCfg: ["save-cfg", "input"],
  switchCfg: ["switch-cfg"],
  flashFirmware: ["transfer", "firmware"],
  downloadVmu: ["transfer", "vmu-read"],
  writeVmu: ["transfer", "vmu-write"],
  downloadDebugTrace: ["transfer", "debug-trace"],
  downloadCtrlPak: ["transfer", "pak-read"],
  writeCtrlPak: ["transfer", "pak-write"],
} as const;

/**
 * Whether config inputs should lock: while a config switch, or a save under
 * `saveKey` (any config save by default), is in flight anywhere in the app.
 */
export function useCfgLocked(
  saveKey: readonly string[] = mutationKeys.saveCfg,
) {
  const saving = useIsMutating({ mutationKey: saveKey }) > 0;
  const switching = useIsMutating({ mutationKey: mutationKeys.switchCfg }) > 0;
  return saving || switching;
}

type GattMutationOptions<TData, TVariables> = Omit<
  UseMutationOptions<TData, Error, TVariables>,
  "mutationFn"
>;

/**
 * Writes to the connected adapter, queued behind any other GATT access.
 * Failures are logged by the QueryClient's mutation cache.
 */
function useGattMutation<TVariables = void, TData = void>(
  write: (
    service: BluetoothRemoteGATTService,
    vars: TVariables,
  ) => Promise<TData>,
  options?: GattMutationOptions<TData, TVariables>,
) {
  const { serviceRef } = useBlueRetro();
  return useMutation({
    ...options,
    mutationFn: (vars: TVariables) =>
      gattSerial(() => write(serviceRef.current!, vars)),
  });
}

const cancelFlags = new Map<string, CancelRef>();

/** One cancel flag per transfer kind, shared by every component that drives it. */
function cancelFlag(mutationKey: readonly string[]): CancelRef {
  const id = mutationKey.join("/");
  let flag = cancelFlags.get(id);
  if (!flag) {
    flag = { current: 0 };
    cancelFlags.set(id, flag);
  }
  return flag;
}

/**
 * A GATT mutation driving a chunked transfer that polls `cancel` between
 * chunks. `isRunning` and `cancel()` go through the mutation cache and a
 * module-level flag rather than this hook instance, so a page left and
 * revisited mid-transfer still shows its progress and can cancel it. The flag
 * is cleared at `mutate` time, so cancelling works while it's still queued.
 */
function useTransferMutation<TVariables = void, TData = void>(
  mutationKey: readonly string[],
  write: (
    service: BluetoothRemoteGATTService,
    vars: TVariables,
    cancel: CancelRef,
  ) => Promise<TData>,
  options?: Omit<
    GattMutationOptions<TData, TVariables>,
    "mutationKey" | "onMutate"
  >,
) {
  const mutation = useGattMutation<TVariables, TData>(
    (service, vars) => write(service, vars, cancelFlag(mutationKey)),
    {
      ...options,
      mutationKey,
      onMutate: () => {
        cancelFlag(mutationKey).current = 0;
      },
    },
  );
  const isRunning = useIsMutating({ mutationKey }) > 0;
  return {
    ...mutation,
    isRunning,
    cancel: () => {
      cancelFlag(mutationKey).current = 1;
    },
  };
}

/**
 * Drops every cached config read and re-reads which config is active, for
 * writes that may have changed it. Older firmware can't report the active
 * config, which is not an error.
 */
function useResyncCfg() {
  const { serviceRef, setCurrentCfg } = useBlueRetro();
  const queryClient = useQueryClient();
  return () => {
    void queryClient.resetQueries({ queryKey: queryKeys.cfg });
    void gattSerial(() => getCfgSrc(serviceRef.current!)).then(
      setCurrentCfg,
      (error: unknown) => {
        if (!isNotFoundError(error)) {
          log("Argh! Couldn't re-read the active config: " + String(error));
        }
      },
    );
  };
}

function swapVmuBytes(data: ArrayBuffer) {
  const view = new DataView(data);
  for (let i = 0; i + 4 <= data.byteLength; i += 4) {
    view.setUint32(i, view.getUint32(i), true);
  }
}

export function useSaveGlobalCfg() {
  const { apiVersion } = useBlueRetro();
  const queryClient = useQueryClient();
  return useGattMutation(
    (service, cfg: GlobalCfg) =>
      saveGlobalCfg(service, encodeGlobalCfg(cfg, apiVersion)),
    {
      mutationKey: mutationKeys.saveGlobalCfg,
      onSuccess: (_, cfg) => {
        queryClient.setQueryData(queryKeys.globalCfg, cfg);
        log("Global Config saved");
      },
    },
  );
}

export function useSaveOutputCfg(cfgId: number) {
  const queryClient = useQueryClient();
  return useGattMutation(
    (service, cfg: OutputCfg) =>
      saveOutputCfg(service, encodeOutputCfg(cfg), String(cfgId)),
    {
      mutationKey: mutationKeys.saveOutputCfg,
      onSuccess: (_, cfg) => {
        queryClient.setQueryData(queryKeys.outputCfg(cfgId), cfg);
        log("Output " + cfgId + " Config saved");
      },
    },
  );
}

/** Used by both the mapping editor and the presets, which write whole rows. */
export function useSaveInputCfg() {
  const queryClient = useQueryClient();
  return useGattMutation(
    (service, { cfgId, rows }: { cfgId: number; rows: MappingRow[] }) =>
      saveInputCfg(service, cfgId, rows),
    {
      mutationKey: mutationKeys.saveInputCfg,
      onSuccess: (stored, { cfgId }) => {
        queryClient.setQueryData(queryKeys.inputCfg(cfgId), stored);
        log("Input " + cfgId + " Config saved");
      },
    },
  );
}

/**
 * Switches the active config and drops every read of the previous one. A
 * failure resyncs too, since the adapter may have switched before the error.
 */
export function useSwitchCfg() {
  const { setCurrentCfg } = useBlueRetro();
  const queryClient = useQueryClient();
  const resync = useResyncCfg();
  return useGattMutation(
    async (service, to: "gameid" | "global") => {
      if (to === "gameid") {
        await setGameIdCfg(service);
      } else {
        await setDefaultCfg(service);
      }
      return getCfgSrc(service);
    },
    {
      mutationKey: mutationKeys.switchCfg,
      onSuccess: (cfg) => {
        setCurrentCfg(cfg);
        void queryClient.resetQueries({ queryKey: queryKeys.cfg });
      },
      onError: resync,
    },
  );
}

/**
 * Removes the file from the cached list before the adapter confirms, first
 * cancelling any list read in flight so it can't bring the file back. The
 * file may be the active GameID config, so the config reads resync too.
 */
export function useDeleteFile() {
  const queryClient = useQueryClient();
  const resync = useResyncCfg();
  return useGattMutation(deleteFile, {
    onMutate: async (filename) => {
      await queryClient.cancelQueries({ queryKey: queryKeys.files });
      queryClient.setQueryData<FileEntry[]>(queryKeys.files, (prev) =>
        prev?.filter((f) => f.name !== filename),
      );
    },
    onSuccess: resync,
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: queryKeys.files }),
  });
}

/** The adapter reboots after a flash; the disconnect clears every cached read. */
export function useFlashFirmware() {
  return useTransferMutation(
    mutationKeys.flashFirmware,
    (service, data: ArrayBuffer, cancel) =>
      otaWriteFirmware(service, data, setProgress, cancel),
  );
}

export function useDeepSleep() {
  return useGattMutation((service) => setDeepSleep(service));
}

export function useResetAdapter() {
  return useGattMutation((service) => setReset(service));
}

export function useFactoryReset() {
  return useGattMutation((service) => setFactoryReset(service));
}

/** Reads the VMU and downloads it as `vmu.bin`. */
export function useDownloadVmu() {
  return useTransferMutation(
    mutationKeys.downloadVmu,
    (service, _: void, cancel) => dcReadFile(service, setProgress, cancel),
    {
      onSuccess: (value) => {
        const data = value.buffer as ArrayBuffer;
        swapVmuBytes(data);
        downloadFile(new Blob([data], { type: "application/bin" }), "vmu.bin");
      },
    },
  );
}

/** Writes a `vmu.bin` image, as produced by `useDownloadVmu`, to the VMU. */
export function useWriteVmu() {
  return useTransferMutation(
    mutationKeys.writeVmu,
    (service, file: ArrayBuffer, cancel) => {
      if (file.byteLength < vmuSize) {
        throw new Error(
          `Expected a ${vmuSize} byte VMU image, got ${file.byteLength} bytes`,
        );
      }
      const data = file.slice(0, vmuSize);
      swapVmuBytes(data);
      return dcWriteFile(service, data, setProgress, cancel);
    },
  );
}

/** Reads the adapter's trace buffer and downloads it as `br_debug_trace.bin`. */
export function useDownloadDebugTrace() {
  return useTransferMutation(
    mutationKeys.downloadDebugTrace,
    (service, _: void, cancel) => dcReadFile(service, setProgress, cancel),
    {
      onSuccess: (value) =>
        downloadFile(
          new Blob([value.buffer as ArrayBuffer], { type: "application/bin" }),
          "br_debug_trace.bin",
        ),
    },
  );
}

/** Reads a controller pak bank and downloads it as `ctrl_pak<n>.mpk`. */
export function useDownloadCtrlPak() {
  return useTransferMutation(
    mutationKeys.downloadCtrlPak,
    (service, pak: number, cancel) =>
      n64ReadFile(service, pak, setProgress, cancel),
    {
      onSuccess: (value, pak) =>
        downloadFile(
          new Blob([value.buffer as ArrayBuffer], { type: "application/mpk" }),
          "ctrl_pak" + (pak + 1) + ".mpk",
        ),
    },
  );
}

export function useWriteCtrlPak() {
  return useTransferMutation(
    mutationKeys.writeCtrlPak,
    (service, { pak, data }: { pak: number; data: ArrayBuffer }, cancel) => {
      if (data.byteLength < pakSize) {
        throw new Error(
          `Expected a ${pakSize} byte pak image, got ${data.byteLength} bytes`,
        );
      }
      return n64WriteFile(
        service,
        data.slice(0, pakSize),
        pak,
        setProgress,
        cancel,
      );
    },
  );
}

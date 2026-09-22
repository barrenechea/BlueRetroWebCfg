import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
  type RefObject,
} from "react";

import { getApiVersion } from "../lib/blueretro/getApiVersion";
import { getAppVersion } from "../lib/blueretro/getAppVersion";
import { getBdAddr } from "../lib/blueretro/getBdAddr";
import { getCfgSrc } from "../lib/blueretro/getCfgSrc";
import { getGameId } from "../lib/blueretro/getGameId";
import { getGameName } from "../lib/blueretro/getGameName";
import { getLatestRelease } from "../lib/blueretro/getLatestRelease";
import { isWebBluetoothEnabled } from "../lib/blueretro/isWebBluetoothEnabled";
import { ChromeSamples, log } from "../lib/logger";
import {
  isNotFoundError,
  useBlueRetroConnection,
  type ConnInfo,
} from "../lib/useBlueRetroConnection";

export interface BlueRetroContextValue {
  connected: boolean;
  connecting: boolean;
  info: ConnInfo | null;
  serviceRef: RefObject<BluetoothRemoteGATTService | null>;
  apiVersion: number;
  gameid: string;
  gamename: string | undefined;
  currentCfg: number;
  setCurrentCfg: (cfg: number) => void;
  connect: () => Promise<void>;
  disconnect: () => void;
}

const BlueRetroContext = createContext<BlueRetroContextValue | null>(null);

// The provider and its consumer hook live together (standard context
// pattern), which trips the component-only export rule.
// eslint-disable-next-line react/only-export-components
export function useBlueRetro(): BlueRetroContextValue {
  const ctx = useContext(BlueRetroContext);
  if (!ctx) {
    throw new Error("useBlueRetro must be used within a BlueRetroProvider");
  }
  return ctx;
}

export function BlueRetroProvider({ children }: { children: ReactNode }) {
  const {
    connected,
    setConnected,
    info,
    setInfo,
    serviceRef,
    connect: connectDevice,
    disconnect,
  } = useBlueRetroConnection();
  const [connecting, setConnecting] = useState(false);
  const [apiVersion, setApiVersion] = useState(0);
  const [gameid, setGameid] = useState("");
  const [gamename, setGamename] = useState<string | undefined>(undefined);
  const [currentCfg, setCurrentCfg] = useState(0);

  const connect = useCallback(async () => {
    if (!isWebBluetoothEnabled()) return;
    setConnecting(true);
    ChromeSamples.clearLog();
    const conn = await connectDevice();
    if (!conn) {
      setConnecting(false);
      return;
    }
    try {
      const bdaddr = await getBdAddr(conn.service);
      const latestVer = await getLatestRelease();
      const appVer = await getAppVersion(conn.service);
      const abi = await getApiVersion(conn.service);
      const gid = await getGameId(conn.service);
      const gn = await getGameName(gid);
      let cfgSrc = 0;
      try {
        cfgSrc = await getCfgSrc(conn.service);
      } catch (error) {
        if (!isNotFoundError(error)) {
          throw error;
        }
      }
      log("ABI version: " + abi);
      setApiVersion(abi);
      setGameid(gid);
      setGamename(gn);
      setCurrentCfg(cfgSrc);
      setInfo({
        name: conn.device.name ?? "",
        bdaddr,
        appVer,
        latestVer,
      });
      setConnected(true);
    } catch (error) {
      if (isNotFoundError(error)) {
        setInfo({
          name: conn.device.name ?? "",
          bdaddr: "",
          appVer: "",
          latestVer: "",
        });
        setConnected(true);
      } else {
        log("Argh! " + error);
      }
    } finally {
      setConnecting(false);
    }
  }, [connectDevice, setConnected, setInfo]);

  return (
    <BlueRetroContext.Provider
      value={{
        connected,
        connecting,
        info,
        serviceRef,
        apiVersion,
        gameid,
        gamename,
        currentCfg,
        setCurrentCfg,
        connect,
        disconnect,
      }}
    >
      {children}
    </BlueRetroContext.Provider>
  );
}

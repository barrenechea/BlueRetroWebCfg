import { useState } from "react";

import { CfgSelection } from "../components/CfgSelection";
import { ConnectButton } from "../components/ConnectButton";
import { DivInfo } from "../components/DivInfo";
import { OutputPanel } from "../components/OutputPanel";
import { PageLayout } from "../components/PageLayout";
import { WikiIntro } from "../components/WikiIntro";
import { getAppVersion } from "../lib/blueretro/getAppVersion";
import { getBdAddr } from "../lib/blueretro/getBdAddr";
import { getCfgSrc } from "../lib/blueretro/getCfgSrc";
import { getGameId } from "../lib/blueretro/getGameId";
import { getGameName } from "../lib/blueretro/getGameName";
import { getLatestRelease } from "../lib/blueretro/getLatestRelease";
import { isWebBluetoothEnabled } from "../lib/blueretro/isWebBluetoothEnabled";
import { savePresetInput } from "../lib/blueretro/savePresetInput";
import { setDefaultCfg } from "../lib/blueretro/setDefaultCfg";
import { setGameIdCfg } from "../lib/blueretro/setGameIdCfg";
import { maxMainInput } from "../lib/constants";
import { ChromeSamples, log } from "../lib/logger";
import { presets, consoles } from "../lib/presets";
import {
  isNotFoundError,
  useBlueRetroConnection,
} from "../lib/useBlueRetroConnection";

export function Presets() {
  const { connected, setConnected, info, setInfo, serviceRef, connect } =
    useBlueRetroConnection();
  const [cfgId, setCfgId] = useState(0);
  const [consoleSel, setConsoleSel] = useState(-1);
  const [presetSel, setPresetSel] = useState(-1);
  const [desc, setDesc] = useState("Select a system and then preset");
  const [gameid, setGameid] = useState("");
  const [gamename, setGamename] = useState<string | undefined>(undefined);
  const [currentCfg, setCurrentCfg] = useState(0);
  const [inputSaved, setInputSaved] = useState(false);

  async function btConn() {
    if (!isWebBluetoothEnabled()) return;
    ChromeSamples.clearLog();
    const conn = await connect();
    if (!conn) return;
    try {
      const bdaddr = await getBdAddr(conn.service);
      const latest_ver = await getLatestRelease();
      const app_ver = await getAppVersion(conn.service);
      const gid = await getGameId(conn.service);
      const gn = await getGameName(gid);
      let cfg_src: number;
      try {
        cfg_src = await getCfgSrc(conn.service);
      } catch (error) {
        if (isNotFoundError(error)) {
          cfg_src = 0;
        } else {
          throw error;
        }
      }
      setGameid(gid);
      setGamename(gn);
      setCurrentCfg(cfg_src);
      setInfo({
        name: conn.device.name ?? "",
        bdaddr,
        appVer: app_ver,
        latestVer: latest_ver,
      });
      setConnected(true);
    } catch (error) {
      log("Argh! " + error);
    }
  }

  function swGameIdCfg() {
    void setGameIdCfg(serviceRef.current!)
      .then(() => getCfgSrc(serviceRef.current!))
      .then((value) => {
        setCurrentCfg(value);
      });
  }

  function swDefaultCfg() {
    void setDefaultCfg(serviceRef.current!)
      .then(() => getCfgSrc(serviceRef.current!))
      .then((value) => {
        setCurrentCfg(value);
      });
  }

  function chooseConsole(value: number) {
    setConsoleSel(value);
    setPresetSel(-1);
    setDesc("Select a console and preset!");
  }

  function choosePreset(value: number) {
    setPresetSel(value);
    setDesc(value == -1 ? "Select a console and preset!" : presets[value].desc);
  }

  async function saveInput() {
    setInputSaved(false);
    if (presetSel != -1) {
      const preset = presets[presetSel];
      try {
        await savePresetInput(preset, serviceRef.current!, Number(cfgId));
        setInputSaved(true);
      } catch (error) {
        log("Argh! " + error);
      }
    }
  }

  // Presets visible for the current console filter, keeping their global
  // index as option value.
  const visiblePresets = presets
    .map((p, i) => ({ preset: p, index: i }))
    .filter(
      ({ preset }) =>
        consoleSel == -1 || preset.console === consoles[consoleSel],
    );

  return (
    <PageLayout title="BlueRetro Presets config">
      <WikiIntro
        url="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#3---presets-page"
        label="3 - Presets page"
      />

      <ConnectButton
        hint="Disconnect all controllers from BlueRetro before connecting for configuration."
        onClick={btConn}
      />
      {info && <DivInfo {...info} game={gamename} gameid={gameid} />}
      {connected && (
        <>
          <CfgSelection
            currentCfg={currentCfg}
            hasGameId={gameid.length > 0}
            onSwitchToGameId={swGameIdCfg}
            onSwitchToGlobal={swDefaultCfg}
          />
          <div id="divInputCfg" style={{ marginBottom: "1em" }}>
            <h2 style={{ margin: 0 }}>Mapping Config</h2>
            <p id="desc">{desc}</p>
            <select
              id="inputSelect"
              value={cfgId}
              onChange={(e) => setCfgId(Number(e.target.value))}
            >
              {Array.from({ length: maxMainInput }, (_, i) => (
                <option key={i} value={i}>
                  Output {i + 1}
                </option>
              ))}
            </select>
            <select
              id="consoleName"
              value={consoleSel}
              onChange={(e) => chooseConsole(Number(e.target.value))}
            >
              <option value={-1}>All</option>
              {consoles.map((c, i) => (
                <option key={i} value={i}>
                  {c}
                </option>
              ))}
            </select>
            <select
              id="presetsName"
              value={presetSel}
              onChange={(e) => choosePreset(Number(e.target.value))}
            >
              <option value={-1}>Select preset</option>
              {visiblePresets.map(({ preset, index }) => (
                <option key={index} value={index}>
                  {preset.name}
                </option>
              ))}
            </select>
            <div style={{ marginTop: "1em" }}>
              <button id="inputSave" onClick={saveInput}>
                Save
              </button>
            </div>
            <div
              id="inputSaveText"
              style={{
                display: inputSaved ? "block" : "none",
                marginTop: "1em",
              }}
            >
              <p
                style={{
                  fontStyle: "italic",
                  fontSize: "small",
                  color: "green",
                }}
              >
                Config saved, mapping changes take effect immediately.
              </p>
            </div>
          </div>
        </>
      )}

      <OutputPanel />
    </PageLayout>
  );
}

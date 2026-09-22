import { useState } from "react";

import { useBlueRetro } from "../components/BlueRetroContext";
import { CfgSelection } from "../components/CfgSelection";
import { WikiIntro } from "../components/WikiIntro";
import { getCfgSrc } from "../lib/blueretro/getCfgSrc";
import { savePresetInput } from "../lib/blueretro/savePresetInput";
import { setDefaultCfg } from "../lib/blueretro/setDefaultCfg";
import { setGameIdCfg } from "../lib/blueretro/setGameIdCfg";
import { maxMainInput } from "../lib/constants";
import { log } from "../lib/logger";
import { presets, consoles } from "../lib/presets";

export function Presets() {
  const { connected, serviceRef, gameid, currentCfg, setCurrentCfg } =
    useBlueRetro();
  const [cfgId, setCfgId] = useState(0);
  const [consoleSel, setConsoleSel] = useState(-1);
  const [presetSel, setPresetSel] = useState(-1);
  const [desc, setDesc] = useState("Select a system and then preset");
  const [inputSaved, setInputSaved] = useState(false);

  function swGameIdCfg() {
    void (async () => {
      try {
        await setGameIdCfg(serviceRef.current!);
        setCurrentCfg(await getCfgSrc(serviceRef.current!));
      } catch (error) {
        log("Argh! " + error);
      }
    })();
  }

  function swDefaultCfg() {
    void (async () => {
      try {
        await setDefaultCfg(serviceRef.current!);
        setCurrentCfg(await getCfgSrc(serviceRef.current!));
      } catch (error) {
        log("Argh! " + error);
      }
    })();
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
    <>
      <WikiIntro
        url="https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual#3---presets-page"
        label="3 - Presets page"
      />

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
              <button id="inputSave" onClick={() => void saveInput()}>
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
    </>
  );
}

import { useMutation } from "@tanstack/react-query";
import { useState } from "react";

import { useBlueRetro } from "../components/BlueRetroContext";
import { CfgSelection } from "../components/CfgSelection";
import { WikiIntro } from "../components/WikiIntro";
import { gattSerial } from "../lib/blueretro/gattSerial";
import { getCfgSrc } from "../lib/blueretro/getCfgSrc";
import { savePresetInput } from "../lib/blueretro/savePresetInput";
import { setDefaultCfg } from "../lib/blueretro/setDefaultCfg";
import { setGameIdCfg } from "../lib/blueretro/setGameIdCfg";
import { maxMainInput } from "../lib/constants";
import { log } from "../lib/logger";
import { presets, consoles } from "../lib/presets";
import type { Preset } from "../lib/types";

export function Presets() {
  const { connected, serviceRef, gameid, currentCfg, setCurrentCfg } =
    useBlueRetro();
  const [cfgId, setCfgId] = useState(0);
  const [consoleSel, setConsoleSel] = useState(-1);
  const [presetSel, setPresetSel] = useState(-1);
  const [desc, setDesc] = useState("Select a system and then preset");

  const swGameIdMutation = useMutation({
    mutationFn: () =>
      gattSerial(async () => {
        await setGameIdCfg(serviceRef.current!);
        return getCfgSrc(serviceRef.current!);
      }),
    onSuccess: (cfg) => setCurrentCfg(cfg),
    onError: (error) => log("Argh! " + error),
  });

  const swDefaultMutation = useMutation({
    mutationFn: () =>
      gattSerial(async () => {
        await setDefaultCfg(serviceRef.current!);
        return getCfgSrc(serviceRef.current!);
      }),
    onSuccess: (cfg) => setCurrentCfg(cfg),
    onError: (error) => log("Argh! " + error),
  });

  const savePresetMutation = useMutation({
    mutationFn: ({ preset, cfgId }: { preset: Preset; cfgId: number }) =>
      gattSerial(() => savePresetInput(preset, serviceRef.current!, cfgId)),
    onError: (error) => log("Argh! " + error),
  });

  function swGameIdCfg() {
    swGameIdMutation.mutate();
  }

  function swDefaultCfg() {
    swDefaultMutation.mutate();
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

  function saveInput() {
    if (presetSel != -1) {
      savePresetMutation.mutate({
        preset: presets[presetSel],
        cfgId: Number(cfgId),
      });
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
              <button id="inputSave" onClick={saveInput}>
                Save
              </button>
            </div>
            <div
              id="inputSaveText"
              style={{
                display: savePresetMutation.isSuccess ? "block" : "none",
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

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

import { useBlueRetro } from "../components/BlueRetroContext";
import { CfgSelection } from "../components/CfgSelection";
import { WikiIntro } from "../components/WikiIntro";
import { gattSerial } from "../lib/blueretro/gattSerial";
import { getCfgSrc } from "../lib/blueretro/getCfgSrc";
import { saveGlobalCfg } from "../lib/blueretro/saveGlobalCfg";
import { saveOutputCfg } from "../lib/blueretro/saveOutputCfg";
import { setDefaultCfg } from "../lib/blueretro/setDefaultCfg";
import { setGameIdCfg } from "../lib/blueretro/setGameIdCfg";
import { writeInputCfg } from "../lib/blueretro/writeInputCfg";
import {
  brUuid,
  btnList,
  labelName,
  systemCfg,
  multitapCfg,
  inquiryMode,
  devCfg,
  accCfg,
  turboMask,
  scaling,
  diagScaling,
  maxMainInput,
  maxOutput,
  maxMax,
  maxThres,
} from "../lib/constants";
import { log } from "../lib/logger";

const maxMapping = 255;

interface MappingRow {
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

function defaultRow(): MappingRow {
  return {
    src: 0,
    dest: 0,
    destId: 0,
    max: 100,
    thres: 50,
    dz: 135,
    turbo: 0,
    scaling: 0,
    diag: 0,
  };
}

const WIKI =
  "https://github.com/darthcloud/BlueRetro/wiki/BlueRetro-BLE-Web-Config-User-Manual";

const FIELD_TITLES: Record<string, string> = {
  src: "This is the source button/axis on the Bluetooth controller",
  dest: "This is the destination button/axis on the wired interface.",
  destId: "This is the ID of the wired interface.",
  max: "If source & destination is an axis then this is the scaling factor base on the destination maximum. If source is a button & destination is an axis then this is the value base on destination maximum that the axis will be set.",
  thres:
    "If source is an axis and destination is a button, this is the threshold requires on the source axis before the button is pressed.",
  dz: "This is the axis dead zone around reset value.",
  turbo: "Turbo function base on the system frame rate.",
  scaling:
    "Various response curve for scaling. (Only Passthrough and Linear, others TBD)",
  diag: "Diagonal scaling options between joystick type. (TBD Not implemented yet)",
};

const FIELD_LABELS: Record<string, string> = {
  src: "Src",
  dest: "Dest",
  destId: "Dest ID",
  max: "Max",
  thres: "Thres",
  dz: "Deadzone",
  turbo: "Turbo",
  scaling: "Scaling",
  diag: "Diagonal",
};

const FIELDS: (keyof MappingRow)[] = [
  "src",
  "dest",
  "destId",
  "max",
  "thres",
  "dz",
  "turbo",
  "scaling",
  "diag",
];

interface GlobalCfgData {
  system: number;
  multitap: number;
  inquiry: number;
  banksel: number;
}

interface OutputCfgData {
  mode: number;
  acc: number;
}

async function readGlobalCfg(
  service: BluetoothRemoteGATTService,
): Promise<GlobalCfgData> {
  log("Get Global Config CHRC...");
  const chrc = await service.getCharacteristic(brUuid[1]);
  log("Reading Global Config...");
  const value = await chrc.readValue();
  log("Global Config size: " + value.byteLength);
  return {
    system: value.getUint8(0),
    multitap: value.getUint8(1),
    inquiry: value.getUint8(2),
    banksel: value.getUint8(3),
  };
}

async function readOutputCfg(
  service: BluetoothRemoteGATTService,
  cfgId: number,
): Promise<OutputCfgData> {
  log("Get Output " + cfgId + " CTRL CHRC...");
  const chrc = await service.getCharacteristic(brUuid[2]);
  log("Set Output " + cfgId + " on CTRL chrc...");
  const outputCtrl = new Uint16Array(1);
  outputCtrl[0] = Number(cfgId);
  await chrc.writeValue(outputCtrl);
  log("Get Output " + cfgId + " DATA CHRC...");
  const dataChrc = await service.getCharacteristic(brUuid[3]);
  log("Reading Output " + cfgId + " Config...");
  const value = await dataChrc.readValue();
  log("Output " + cfgId + " Config size: " + value.byteLength);
  return { mode: value.getUint8(0), acc: value.getUint8(1) };
}

async function readInputCfg(
  service: BluetoothRemoteGATTService,
  cfgId: number,
): Promise<MappingRow[]> {
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
  const nbMapping = cfg[2];
  const rows: MappingRow[] = [];
  let j = 3;
  for (let i = 0; i < nbMapping; i++) {
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
}

export function Advance() {
  const queryClient = useQueryClient();
  const {
    connected,
    serviceRef,
    apiVersion,
    gameid,
    currentCfg,
    setCurrentCfg,
  } = useBlueRetro();

  // Global config
  const [system, setSystem] = useState(0);
  const [multitap, setMultitap] = useState(0);
  const [inquiry, setInquiry] = useState(0);
  const [banksel, setBanksel] = useState(0);

  // Output config
  const [outputSelect, setOutputSelect] = useState(0);
  const [outputMode, setOutputMode] = useState(0);
  const [outputAcc, setOutputAcc] = useState(0);
  const [outputMouse, setOutputMouse] = useState(false);

  // Mapping config
  const [inputSelect, setInputSelect] = useState(0);
  const [srcLabel, setSrcLabel] = useState(0);
  const [dstLabel, setDstLabel] = useState(0);
  const [mappings, setMappings] = useState<MappingRow[]>([defaultRow()]);

  const globalQuery = useQuery({
    queryKey: ["advance", "global"],
    enabled: connected,
    queryFn: () =>
      gattSerial(async () => {
        try {
          return await readGlobalCfg(serviceRef.current!);
        } catch (error) {
          log("Argh! " + error);
          throw error;
        }
      }),
  });

  const outputQuery = useQuery({
    queryKey: ["advance", "output", outputSelect],
    enabled: connected,
    queryFn: () =>
      gattSerial(async () => {
        try {
          return await readOutputCfg(serviceRef.current!, outputSelect);
        } catch (error) {
          log("Argh! " + error);
          throw error;
        }
      }),
  });

  const inputQuery = useQuery({
    queryKey: ["advance", "input", inputSelect],
    enabled: connected,
    queryFn: () =>
      gattSerial(async () => {
        try {
          return await readInputCfg(serviceRef.current!, inputSelect);
        } catch (error) {
          log("Argh! " + error);
          throw error;
        }
      }),
  });

  // Re-seed the form drafts whenever a (cached) device read lands,
  // including silent background refreshes. Storing the last-seeded data
  // and adjusting state during render is React's documented pattern for
  // derived state (no effect, no cascading renders).
  const [seededGlobal, setSeededGlobal] = useState<GlobalCfgData>();
  if (globalQuery.data !== seededGlobal) {
    setSeededGlobal(globalQuery.data);
    if (globalQuery.data) {
      setSystem(globalQuery.data.system);
      setMultitap(globalQuery.data.multitap);
      if (apiVersion > 0) setInquiry(globalQuery.data.inquiry);
      if (apiVersion > 1) setBanksel(globalQuery.data.banksel);
    }
  }

  const [seededOutput, setSeededOutput] = useState<OutputCfgData>();
  if (outputQuery.data !== seededOutput) {
    setSeededOutput(outputQuery.data);
    if (outputQuery.data) {
      setOutputMode(outputQuery.data.mode);
      setOutputAcc(outputQuery.data.acc);
    }
  }

  const [seededInput, setSeededInput] = useState<MappingRow[]>();
  if (inputQuery.data !== seededInput) {
    setSeededInput(inputQuery.data);
    if (inputQuery.data) {
      setMappings(inputQuery.data);
    }
  }

  const saveGlobalMutation = useMutation({
    mutationFn: (data: Uint8Array<ArrayBuffer>) =>
      gattSerial(() => saveGlobalCfg(serviceRef.current!, data)),
    onSuccess: () => log("Global Config saved"),
    onError: (error) => log("Argh! " + error),
  });

  const saveOutputMutation = useMutation({
    mutationFn: ({
      data,
      cfgId,
    }: {
      data: Uint8Array<ArrayBuffer>;
      cfgId: number;
    }) =>
      gattSerial(() => saveOutputCfg(serviceRef.current!, data, String(cfgId))),
    onSuccess: (_, { data, cfgId }) => {
      if (data[0] == 3) {
        setOutputMouse(true);
      }
      log("Output " + cfgId + " Config saved");
    },
    onError: (error) => log("Argh! " + error),
  });

  const saveInputMutation = useMutation({
    mutationFn: ({
      cfg,
      cfgId,
    }: {
      cfg: Uint8Array<ArrayBuffer>;
      cfgId: number;
    }) => gattSerial(() => writeInputCfg(cfgId, cfg, serviceRef.current!)),
    onSuccess: (_, { cfgId }) => log("Input " + cfgId + " Config saved"),
    onError: (error) => log("Argh! " + error),
  });

  const swGameIdMutation = useMutation({
    mutationFn: () =>
      gattSerial(async () => {
        await setGameIdCfg(serviceRef.current!);
        return getCfgSrc(serviceRef.current!);
      }),
    onSuccess: (cfg) => {
      setCurrentCfg(cfg);
      // The active config changed: refetch the cached reads.
      void queryClient.invalidateQueries({ queryKey: ["advance"] });
    },
    onError: (error) => log("Argh! " + error),
  });

  const swDefaultMutation = useMutation({
    mutationFn: () =>
      gattSerial(async () => {
        await setDefaultCfg(serviceRef.current!);
        return getCfgSrc(serviceRef.current!);
      }),
    onSuccess: (cfg) => {
      setCurrentCfg(cfg);
      // The active config changed: refetch the cached reads.
      void queryClient.invalidateQueries({ queryKey: ["advance"] });
    },
    onError: (error) => log("Argh! " + error),
  });

  function saveGlobal() {
    let data: Uint8Array<ArrayBuffer>;
    if (apiVersion > 1) {
      data = new Uint8Array(4);
    } else if (apiVersion > 0) {
      data = new Uint8Array(3);
    } else {
      data = new Uint8Array(2);
    }
    data[0] = system;
    data[1] = multitap;
    if (apiVersion > 0) {
      data[2] = inquiry;
    }
    if (apiVersion > 1) {
      data[3] = banksel;
    }
    saveGlobalMutation.mutate(data);
  }

  function saveOutput() {
    setOutputMouse(false);
    const data = new Uint8Array(2);
    data[0] = outputMode;
    data[1] = outputAcc;
    saveOutputMutation.mutate({ data, cfgId: outputSelect });
  }

  function saveInput() {
    const cfgSize = mappings.length * 8 + 3;
    const cfg = new Uint8Array(cfgSize);
    let j = 0;
    cfg[j++] = 0;
    cfg[j++] = 0;
    cfg[j++] = mappings.length;
    for (const row of mappings) {
      cfg[j++] = row.src;
      cfg[j++] = row.dest;
      cfg[j++] = row.destId;
      cfg[j++] = row.max;
      cfg[j++] = row.thres;
      cfg[j++] = row.dz;
      cfg[j++] = row.turbo;
      cfg[j++] = Number(row.scaling) | (Number(row.diag) << 4);
    }
    saveInputMutation.mutate({ cfg, cfgId: inputSelect });
  }

  function swGameIdCfg() {
    swGameIdMutation.mutate();
  }

  function swDefaultCfg() {
    swDefaultMutation.mutate();
  }

  function addInput() {
    if (mappings.length < maxMapping) {
      setMappings([...mappings, defaultRow()]);
    }
  }

  function delInput(i: number) {
    setMappings(mappings.filter((_, idx) => idx !== i));
  }

  function updateRow(i: number, field: keyof MappingRow, value: number) {
    setMappings(
      mappings.map((row, idx) =>
        idx === i ? { ...row, [field]: value } : row,
      ),
    );
  }

  function renderOptions(field: keyof MappingRow, label: number) {
    switch (field) {
      case "src":
        return btnList.map((b, i) => (
          <option key={i} value={i}>
            {b[label]}
          </option>
        ));
      case "dest":
        return btnList.map((b, i) => (
          <option key={i} value={i}>
            {b[label]}
          </option>
        ));
      case "destId":
        return Array.from({ length: maxOutput }, (_, i) => (
          <option key={i} value={i}>
            Output {i + 1}
          </option>
        ));
      case "max":
      case "dz":
        return Array.from({ length: maxMax / 5 + 1 }, (_, k) => {
          const i = k * 5;
          return (
            <option key={i} value={i}>
              {field === "dz" ? i / 10000 + "%" : i + "%"}
            </option>
          );
        });
      case "thres":
        return Array.from({ length: maxThres / 5 + 1 }, (_, k) => {
          const i = k * 5;
          return (
            <option key={i} value={i}>
              {i + "%"}
            </option>
          );
        });
      case "turbo":
        return Object.keys(turboMask).map((key) => (
          <option key={key} value={turboMask[key]}>
            {key}
          </option>
        ));
      case "scaling":
        return scaling.map((s, i) => (
          <option key={i} value={i}>
            {s}
          </option>
        ));
      case "diag":
        return diagScaling.map((d, i) => (
          <option key={i} value={i}>
            {d}
          </option>
        ));
    }
  }

  return (
    <>
      <WikiIntro
        url={WIKI + "#2---advance-config-page"}
        label="2 - Advance config page"
      />

      {connected && (
        <>
          <CfgSelection
            currentCfg={currentCfg}
            hasGameId={gameid.length > 0}
            docUrl={WIKI + "#21---config-selection"}
            onSwitchToGameId={swGameIdCfg}
            onSwitchToGlobal={swDefaultCfg}
          />

          <div id="divGlobalCfg" style={{ marginBottom: "1em" }}>
            <h2 style={{ margin: 0 }}>Global Config</h2>
            <a href={WIKI + "#22---global-config"} target="_blank">
              Wiki doc for Global config
            </a>
            <br />
            <br />
            <div>
              <label htmlFor="systemCfg">System: </label>
              <select
                id="systemCfg"
                value={system}
                onChange={(e) => setSystem(Number(e.target.value))}
              >
                {systemCfg.map((s, i) => (
                  <option key={i} value={i}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="multitapCfg">Multitap: </label>
              <select
                id="multitapCfg"
                value={multitap}
                onChange={(e) => setMultitap(Number(e.target.value))}
              >
                {multitapCfg.map((s, i) => (
                  <option key={i} value={i}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            {apiVersion > 0 && (
              <div>
                <label htmlFor="inquiryMode">Inquiry mode: </label>
                <select
                  id="inquiryMode"
                  value={inquiry}
                  onChange={(e) => setInquiry(Number(e.target.value))}
                >
                  {inquiryMode.map((s, i) => (
                    <option key={i} value={i}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {apiVersion > 1 && (
              <div>
                <label htmlFor="banksel">Memory Card Bank: </label>
                <select
                  id="banksel"
                  value={banksel}
                  onChange={(e) => setBanksel(Number(e.target.value))}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <option key={i} value={i}>
                      Bank {i + 1}
                    </option>
                  ))}
                  <option value={0xdb}>Debug mode</option>
                </select>
              </div>
            )}
            <div style={{ marginTop: "1em" }}>
              <button id="globalSave" onClick={saveGlobal}>
                Save
              </button>
            </div>
            <div
              id="globalSaveText"
              style={{
                display: saveGlobalMutation.isSuccess ? "block" : "none",
                marginTop: "1em",
              }}
            >
              <p
                style={{
                  fontStyle: "italic",
                  fontSize: "small",
                  color: "red",
                }}
              >
                Config saved, power cycle BlueRetro adapter for change to take
                effect.
              </p>
            </div>
          </div>

          <div id="divOutputCfg" style={{ marginBottom: "1em" }}>
            <h2 style={{ margin: 0 }}>Output Config</h2>
            <a href={WIKI + "#23---output-config"} target="_blank">
              Wiki doc for Output config
            </a>
            <br />
            <br />
            <div>
              <label htmlFor="outputSelect">Select output: </label>
              <select
                id="outputSelect"
                value={outputSelect}
                onChange={(e) => setOutputSelect(Number(e.target.value))}
              >
                {Array.from({ length: maxOutput }, (_, i) => (
                  <option key={i} value={i}>
                    Output {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginTop: "1em" }}>
              <span style={{ display: "inline-block" }}>
                <label htmlFor="outputMode" style={{ display: "block" }}>
                  Mode
                </label>
                <select
                  id="outputMode"
                  value={outputMode}
                  onChange={(e) => setOutputMode(Number(e.target.value))}
                >
                  {devCfg.map((s, i) => (
                    <option key={i} value={i}>
                      {s}
                    </option>
                  ))}
                </select>
              </span>
              <span style={{ display: "inline-block" }}>
                <label htmlFor="outputAcc" style={{ display: "block" }}>
                  Accessories
                </label>
                <select
                  id="outputAcc"
                  value={outputAcc}
                  onChange={(e) => setOutputAcc(Number(e.target.value))}
                >
                  {accCfg.map((s, i) => (
                    <option key={i} value={i}>
                      {s}
                    </option>
                  ))}
                </select>
              </span>
            </div>
            <div style={{ marginTop: "1em" }}>
              <button id="outputSave" onClick={saveOutput}>
                Save
              </button>
            </div>
            <div
              id="outputSaveText"
              style={{
                display: saveOutputMutation.isSuccess ? "block" : "none",
                marginTop: "1em",
              }}
            >
              <p
                style={{
                  fontStyle: "italic",
                  fontSize: "small",
                  color: "red",
                }}
              >
                Config saved, power cycle BlueRetro adapter for Mode change to
                take effect.
              </p>
            </div>
            <div
              id="outputSaveMouse"
              style={{
                display: outputMouse ? "block" : "none",
                marginTop: "1em",
              }}
            >
              <p
                style={{
                  fontStyle: "italic",
                  fontSize: "small",
                  color: "orange",
                }}
              >
                Mouse mode require setting &lt;Default Mouse&gt; preset.
              </p>
            </div>
          </div>

          <div id="divInputCfg" style={{ marginBottom: "1em" }}>
            <h2 style={{ margin: 0 }}>Mapping Config</h2>
            <a href={WIKI + "#24---mapping-config"} target="_blank">
              Wiki doc for Mapping config
            </a>
            <br />
            <br />
            <div style={{ marginBottom: "1em" }}>
              <label htmlFor="inputSelect">Select Bluetooth device: </label>
              <select
                id="inputSelect"
                value={inputSelect}
                onChange={(e) => setInputSelect(Number(e.target.value))}
              >
                {Array.from({ length: maxMainInput }, (_, i) => (
                  <option key={i} value={i}>
                    Device {i + 1}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="srcLabel">Src label: </label>
              <select
                id="srcLabel"
                value={srcLabel}
                onChange={(e) => setSrcLabel(Number(e.target.value))}
              >
                {labelName.map((s, i) => (
                  <option key={i} value={i}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ marginBottom: "1em" }}>
              <label htmlFor="dstLabel">Dst label: </label>
              <select
                id="dstLabel"
                value={dstLabel}
                onChange={(e) => setDstLabel(Number(e.target.value))}
              >
                {labelName.map((s, i) => (
                  <option key={i} value={i}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div id="divMappingGrp">
              {mappings.map((row, i) => (
                <div key={i} id={i === 0 ? "divMapping" : undefined}>
                  {FIELDS.map((field) => (
                    <span
                      key={field}
                      title={FIELD_TITLES[field]}
                      style={{
                        maxWidth: "10%",
                        display: "inline-block",
                      }}
                    >
                      <label style={{ display: "block" }}>
                        {FIELD_LABELS[field]}
                      </label>
                      <select
                        className={field}
                        value={row[field]}
                        onChange={(e) =>
                          updateRow(i, field, Number(e.target.value))
                        }
                      >
                        {renderOptions(
                          field,
                          field === "src" ? srcLabel : dstLabel,
                        )}
                      </select>
                    </span>
                  ))}
                  {i > 0 && <button onClick={() => delInput(i)}>-</button>}
                </div>
              ))}
              <button onClick={addInput}>+</button>
              <div style={{ marginTop: "1em" }}>
                <button id="inputSave" onClick={saveInput}>
                  Save
                </button>
              </div>
              <div
                id="inputSaveText"
                style={{
                  display: saveInputMutation.isSuccess ? "block" : "none",
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
          </div>
        </>
      )}
    </>
  );
}

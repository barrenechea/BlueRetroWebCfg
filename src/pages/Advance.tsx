import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CircleCheckIcon, InfoIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

import { useBlueRetro } from "../components/BlueRetroContext";
import { CfgSelection } from "../components/CfgSelection";
import { DocLink } from "../components/DocLink";
import { NotConnected, PageHeader } from "../components/PageHeader";
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
import { docs } from "../lib/docs";
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

// Shared by the header row and every data row so the columns line up. Below
// `lg` the grid collapses and each cell shows its own label instead.
const MAPPING_GRID =
  "lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1.3fr)_minmax(0,1fr)_minmax(0,0.85fr)_minmax(0,0.85fr)_minmax(0,1fr)_minmax(0,0.9fr)_minmax(0,1fr)_minmax(0,1fr)_2rem]";

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
          <NativeSelectOption key={i} value={i}>
            {b[label]}
          </NativeSelectOption>
        ));
      case "dest":
        return btnList.map((b, i) => (
          <NativeSelectOption key={i} value={i}>
            {b[label]}
          </NativeSelectOption>
        ));
      case "destId":
        return Array.from({ length: maxOutput }, (_, i) => (
          <NativeSelectOption key={i} value={i}>
            Output {i + 1}
          </NativeSelectOption>
        ));
      case "max":
      case "dz":
        return Array.from({ length: maxMax / 5 + 1 }, (_, k) => {
          const i = k * 5;
          return (
            <NativeSelectOption key={i} value={i}>
              {field === "dz" ? i / 10000 + "%" : i + "%"}
            </NativeSelectOption>
          );
        });
      case "thres":
        return Array.from({ length: maxThres / 5 + 1 }, (_, k) => {
          const i = k * 5;
          return (
            <NativeSelectOption key={i} value={i}>
              {i + "%"}
            </NativeSelectOption>
          );
        });
      case "turbo":
        return Object.keys(turboMask).map((key) => (
          <NativeSelectOption key={key} value={turboMask[key]}>
            {key}
          </NativeSelectOption>
        ));
      case "scaling":
        return scaling.map((s, i) => (
          <NativeSelectOption key={i} value={i}>
            {s}
          </NativeSelectOption>
        ));
      case "diag":
        return diagScaling.map((d, i) => (
          <NativeSelectOption key={i} value={i}>
            {d}
          </NativeSelectOption>
        ));
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Advance Config"
        description="Global settings, per output behaviour and the full button mapping table."
        doc={docs.advance}
      />

      {!connected && <NotConnected what="edit the configuration" />}

      {connected && (
        <>
          <CfgSelection
            currentCfg={currentCfg}
            hasGameId={gameid.length > 0}
            doc={docs.cfgSelection}
            onSwitchToGameId={swGameIdCfg}
            onSwitchToGlobal={swDefaultCfg}
          />

          <Card>
            <CardHeader>
              <CardTitle>Global Config</CardTitle>
              <CardDescription>Applies to the whole adapter.</CardDescription>
              <CardAction>
                <DocLink href={docs.globalCfg.href}>
                  {docs.globalCfg.label}
                </DocLink>
              </CardAction>
            </CardHeader>
            <CardContent className="gap-6">
              <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="systemCfg">System</FieldLabel>
                  <NativeSelect
                    className="w-full"
                    id="systemCfg"
                    value={system}
                    onChange={(e) => setSystem(Number(e.target.value))}
                  >
                    {systemCfg.map((s, i) => (
                      <NativeSelectOption key={i} value={i}>
                        {s}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="multitapCfg">Multitap</FieldLabel>
                  <NativeSelect
                    className="w-full"
                    id="multitapCfg"
                    value={multitap}
                    onChange={(e) => setMultitap(Number(e.target.value))}
                  >
                    {multitapCfg.map((s, i) => (
                      <NativeSelectOption key={i} value={i}>
                        {s}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                {apiVersion > 0 && (
                  <Field>
                    <FieldLabel htmlFor="inquiryMode">Inquiry mode</FieldLabel>
                    <NativeSelect
                      className="w-full"
                      id="inquiryMode"
                      value={inquiry}
                      onChange={(e) => setInquiry(Number(e.target.value))}
                    >
                      {inquiryMode.map((s, i) => (
                        <NativeSelectOption key={i} value={i}>
                          {s}
                        </NativeSelectOption>
                      ))}
                    </NativeSelect>
                  </Field>
                )}
                {apiVersion > 1 && (
                  <Field>
                    <FieldLabel htmlFor="banksel">Memory Card Bank</FieldLabel>
                    <NativeSelect
                      className="w-full"
                      id="banksel"
                      value={banksel}
                      onChange={(e) => setBanksel(Number(e.target.value))}
                    >
                      {[0, 1, 2, 3].map((i) => (
                        <NativeSelectOption key={i} value={i}>
                          Bank {i + 1}
                        </NativeSelectOption>
                      ))}
                      <NativeSelectOption value={0xdb}>
                        Debug mode
                      </NativeSelectOption>
                    </NativeSelect>
                  </Field>
                )}
              </FieldGroup>

              {saveGlobalMutation.isSuccess && (
                <Alert>
                  <CircleCheckIcon />
                  <AlertTitle>Config saved</AlertTitle>
                  <AlertDescription>
                    Power cycle the BlueRetro adapter for the change to take
                    effect.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="border-t">
              <Button onClick={saveGlobal}>Save</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Output Config</CardTitle>
              <CardDescription>
                Device mode and accessories for one wired output.
              </CardDescription>
              <CardAction>
                <DocLink href={docs.outputCfg.href}>
                  {docs.outputCfg.label}
                </DocLink>
              </CardAction>
            </CardHeader>
            <CardContent className="gap-6">
              <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="outputSelect">Select output</FieldLabel>
                  <NativeSelect
                    className="w-full"
                    id="outputSelect"
                    value={outputSelect}
                    onChange={(e) => setOutputSelect(Number(e.target.value))}
                  >
                    {Array.from({ length: maxOutput }, (_, i) => (
                      <NativeSelectOption key={i} value={i}>
                        Output {i + 1}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="outputMode">Mode</FieldLabel>
                  <NativeSelect
                    className="w-full"
                    id="outputMode"
                    value={outputMode}
                    onChange={(e) => setOutputMode(Number(e.target.value))}
                  >
                    {devCfg.map((s, i) => (
                      <NativeSelectOption key={i} value={i}>
                        {s}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="outputAcc">Accessories</FieldLabel>
                  <NativeSelect
                    className="w-full"
                    id="outputAcc"
                    value={outputAcc}
                    onChange={(e) => setOutputAcc(Number(e.target.value))}
                  >
                    {accCfg.map((s, i) => (
                      <NativeSelectOption key={i} value={i}>
                        {s}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              </FieldGroup>

              {saveOutputMutation.isSuccess && (
                <Alert>
                  <CircleCheckIcon />
                  <AlertTitle>Config saved</AlertTitle>
                  <AlertDescription>
                    Power cycle the BlueRetro adapter for the Mode change to
                    take effect.
                  </AlertDescription>
                </Alert>
              )}
              {outputMouse && (
                <Alert>
                  <InfoIcon />
                  <AlertTitle>
                    Mouse mode requires the &lt;Default Mouse&gt; preset.
                  </AlertTitle>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="border-t">
              <Button onClick={saveOutput}>Save</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mapping Config</CardTitle>
              <CardDescription>
                Route each button or axis on the Bluetooth controller to one on
                the wired interface.
              </CardDescription>
              <CardAction>
                <DocLink href={docs.mappingCfg.href}>
                  {docs.mappingCfg.label}
                </DocLink>
              </CardAction>
            </CardHeader>
            <CardContent className="gap-6">
              <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="inputSelect">
                    Select Bluetooth device
                  </FieldLabel>
                  <NativeSelect
                    className="w-full"
                    id="inputSelect"
                    value={inputSelect}
                    onChange={(e) => setInputSelect(Number(e.target.value))}
                  >
                    {Array.from({ length: maxMainInput }, (_, i) => (
                      <NativeSelectOption key={i} value={i}>
                        Device {i + 1}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="srcLabel">Src label</FieldLabel>
                  <NativeSelect
                    className="w-full"
                    id="srcLabel"
                    value={srcLabel}
                    onChange={(e) => setSrcLabel(Number(e.target.value))}
                  >
                    {labelName.map((s, i) => (
                      <NativeSelectOption key={i} value={i}>
                        {s}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="dstLabel">Dst label</FieldLabel>
                  <NativeSelect
                    className="w-full"
                    id="dstLabel"
                    value={dstLabel}
                    onChange={(e) => setDstLabel(Number(e.target.value))}
                  >
                    {labelName.map((s, i) => (
                      <NativeSelectOption key={i} value={i}>
                        {s}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              </FieldGroup>

              <div className="lg:overflow-x-auto">
                <div className="lg:min-w-[60rem]">
                  {/* Column headers stand in for the per-cell labels once
                      the rows line up as a table. */}
                  <div
                    className={`text-muted-foreground hidden gap-2 pb-2 text-xs font-medium lg:grid ${MAPPING_GRID}`}
                  >
                    {FIELDS.map((field) => (
                      <span
                        key={field}
                        title={FIELD_TITLES[field]}
                        className="cursor-help truncate"
                      >
                        {FIELD_LABELS[field]}
                      </span>
                    ))}
                    <span className="sr-only">Remove</span>
                  </div>

                  <div className="space-y-3 lg:space-y-0 lg:divide-y lg:border-y">
                    {mappings.map((row, i) => (
                      <div
                        key={i}
                        className={`grid grid-cols-2 gap-3 rounded-lg border p-3 sm:grid-cols-3 lg:items-center lg:gap-2 lg:rounded-none lg:border-0 lg:p-0 lg:py-2 ${MAPPING_GRID}`}
                      >
                        {FIELDS.map((field) => (
                          <div key={field} className="min-w-0">
                            <Label
                              htmlFor={`mapping-${i}-${field}`}
                              title={FIELD_TITLES[field]}
                              className="mb-2 lg:sr-only"
                            >
                              {FIELD_LABELS[field]}
                            </Label>
                            <NativeSelect
                              id={`mapping-${i}-${field}`}
                              size="sm"
                              className="w-full"
                              value={row[field]}
                              onChange={(e) =>
                                updateRow(i, field, Number(e.target.value))
                              }
                            >
                              {renderOptions(
                                field,
                                field === "src" ? srcLabel : dstLabel,
                              )}
                            </NativeSelect>
                          </div>
                        ))}
                        <div className="flex items-end justify-end lg:items-center">
                          {i > 0 && (
                            <Button
                              variant="ghost"
                              size="icon-sm"
                              aria-label={`Remove mapping ${i + 1}`}
                              title="Remove mapping"
                              onClick={() => delInput(i)}
                            >
                              <Trash2Icon />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between gap-3">
                <Button
                  variant="outline"
                  onClick={addInput}
                  disabled={mappings.length >= maxMapping}
                >
                  <PlusIcon data-icon="inline-start" />
                  Add mapping
                </Button>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {mappings.length} / {maxMapping}
                </span>
              </div>

              {saveInputMutation.isSuccess && (
                <Alert>
                  <CircleCheckIcon />
                  <AlertTitle>Config saved</AlertTitle>
                  <AlertDescription>
                    Mapping changes take effect immediately.
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="border-t">
              <Button onClick={saveInput}>Save</Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}

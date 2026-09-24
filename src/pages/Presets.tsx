import { useMutation } from "@tanstack/react-query";
import { CircleCheckIcon } from "lucide-react";
import { useState } from "react";

import { Alert, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

import { useBlueRetro } from "../components/BlueRetroContext";
import { CfgSelection } from "../components/CfgSelection";
import { NotConnected, PageHeader } from "../components/PageHeader";
import { gattSerial } from "../lib/blueretro/gattSerial";
import { getCfgSrc } from "../lib/blueretro/getCfgSrc";
import { savePresetInput } from "../lib/blueretro/savePresetInput";
import { setDefaultCfg } from "../lib/blueretro/setDefaultCfg";
import { setGameIdCfg } from "../lib/blueretro/setGameIdCfg";
import { maxMainInput } from "../lib/constants";
import { docs } from "../lib/docs";
import { log } from "../lib/logger";
import { presets, consoles } from "../lib/presets";
import type { Preset } from "../lib/types";

export function Presets() {
  const { connected, serviceRef, gameid, currentCfg, setCurrentCfg } =
    useBlueRetro();
  const [cfgId, setCfgId] = useState(0);
  const [consoleSel, setConsoleSel] = useState(-1);
  const [presetSel, setPresetSel] = useState(-1);

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

  const selected = presetSel === -1 ? undefined : presets[presetSel];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Presets"
        description="Load a ready made mapping onto one of BlueRetro's outputs."
        doc={docs.presets}
      />

      {!connected && <NotConnected what="load a preset" />}

      {connected && (
        <>
          <CfgSelection
            currentCfg={currentCfg}
            hasGameId={gameid.length > 0}
            onSwitchToGameId={swGameIdCfg}
            onSwitchToGlobal={swDefaultCfg}
          />

          <Card>
            <CardHeader>
              <CardTitle>Mapping Config</CardTitle>
            </CardHeader>
            <CardContent className="gap-6">
              <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field>
                  <FieldLabel htmlFor="inputSelect">Output</FieldLabel>
                  <NativeSelect
                    className="w-full"
                    id="inputSelect"
                    value={cfgId}
                    onChange={(e) => setCfgId(Number(e.target.value))}
                  >
                    {Array.from({ length: maxMainInput }, (_, i) => (
                      <NativeSelectOption key={i} value={i}>
                        Output {i + 1}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="consoleName">System</FieldLabel>
                  <NativeSelect
                    className="w-full"
                    id="consoleName"
                    value={consoleSel}
                    onChange={(e) => chooseConsole(Number(e.target.value))}
                  >
                    <NativeSelectOption value={-1}>All</NativeSelectOption>
                    {consoles.map((c, i) => (
                      <NativeSelectOption key={i} value={i}>
                        {c}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
                <Field>
                  <FieldLabel htmlFor="presetsName">Preset</FieldLabel>
                  <NativeSelect
                    className="w-full"
                    id="presetsName"
                    value={presetSel}
                    onChange={(e) => setPresetSel(Number(e.target.value))}
                  >
                    <NativeSelectOption value={-1}>
                      Select preset
                    </NativeSelectOption>
                    {visiblePresets.map(({ preset, index }) => (
                      <NativeSelectOption key={index} value={index}>
                        {preset.name}
                      </NativeSelectOption>
                    ))}
                  </NativeSelect>
                </Field>
              </FieldGroup>

              <Item variant="muted">
                <ItemContent>
                  {selected ? (
                    <>
                      <ItemTitle>{selected.name}</ItemTitle>
                      <ItemDescription className="line-clamp-none">
                        {selected.desc}
                      </ItemDescription>
                    </>
                  ) : (
                    <ItemDescription>
                      Select a system and then preset.
                    </ItemDescription>
                  )}
                </ItemContent>
              </Item>

              {savePresetMutation.isSuccess && (
                <Alert>
                  <CircleCheckIcon />
                  <AlertTitle>
                    Config saved, mapping changes take effect immediately.
                  </AlertTitle>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="border-t">
              <Button onClick={saveInput} disabled={presetSel === -1}>
                Save
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}

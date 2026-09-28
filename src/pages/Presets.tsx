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
import { FIELD_GRID } from "../components/FormSkeleton";
import { NotConnected, PageHeader } from "../components/PageHeader";
import { presetMappings } from "../lib/blueretro/presetMappings";
import { maxMainInput } from "../lib/constants";
import { docs } from "../lib/docs";
import { mutationKeys, useCfgLocked, useSaveInputCfg } from "../lib/mutations";
import { presets, consoles } from "../lib/presets";

export function Presets() {
  const { connected, currentCfg } = useBlueRetro();
  const [cfgId, setCfgId] = useState(0);
  const [consoleSel, setConsoleSel] = useState(-1);
  const [presetSel, setPresetSel] = useState(-1);

  const savePresetMutation = useSaveInputCfg();
  const locked = useCfgLocked(mutationKeys.saveInputCfg);
  const [savedUnder, setSavedUnder] = useState<number>();

  function chooseConsole(value: number) {
    setConsoleSel(value);
    setPresetSel(-1);
  }

  function saveInput() {
    if (presetSel != -1) {
      setSavedUnder(currentCfg);
      savePresetMutation.mutate({
        cfgId,
        rows: presetMappings(presets[presetSel], cfgId),
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
          <CfgSelection />

          <Card>
            <CardHeader>
              <CardTitle>Mapping Config</CardTitle>
            </CardHeader>
            <CardContent className="gap-6">
              <FieldGroup className={FIELD_GRID}>
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

              {savePresetMutation.isSuccess && savedUnder === currentCfg && (
                <Alert>
                  <CircleCheckIcon />
                  <AlertTitle>
                    Config saved, mapping changes take effect immediately.
                  </AlertTitle>
                </Alert>
              )}
            </CardContent>
            <CardFooter className="border-t">
              <Button onClick={saveInput} disabled={presetSel === -1 || locked}>
                Save
              </Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}

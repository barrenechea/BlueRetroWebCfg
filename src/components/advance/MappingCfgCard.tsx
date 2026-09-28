import { CircleCheckIcon, PlusIcon, Trash2Icon } from "lucide-react";
import { useState, type ReactNode } from "react";

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
import { Skeleton } from "@/components/ui/skeleton";

import type { MappingRow } from "../../lib/blueretro/inputCfg";
import {
  btnList,
  labelName,
  turboMask,
  scaling,
  diagScaling,
  maxMainInput,
  maxOutput,
  maxMax,
  maxThres,
} from "../../lib/constants";
import { docs } from "../../lib/docs";
import {
  mutationKeys,
  useCfgLocked,
  useSaveInputCfg,
} from "../../lib/mutations";
import { useInputCfg } from "../../lib/queries";
import { useDraft } from "../../lib/useDraft";
import { useBlueRetro } from "../BlueRetroContext";
import { DocLink } from "../DocLink";
import { FIELD_GRID, SaveFooterSkeleton } from "../FormSkeleton";
import { QueryBoundary } from "../QueryBoundary";

const maxMapping = 255;

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

const MAPPING_ROW = `grid grid-cols-2 gap-3 rounded-lg border p-3 sm:grid-cols-3 lg:items-center lg:gap-2 lg:rounded-none lg:border-0 lg:p-0 lg:py-2 ${MAPPING_GRID}`;

const SKELETON_ROWS = 5;

/**
 * The device and label pickers sit outside the boundary, so switching devices
 * only suspends the mapping table below them.
 */
export function MappingCfgCard() {
  const { currentCfg } = useBlueRetro();
  const [cfgId, setCfgId] = useState(0);
  const scope = `${currentCfg}:${cfgId}`;
  const locked = useCfgLocked(mutationKeys.saveInputCfg);
  const [srcLabel, setSrcLabel] = useState(0);
  const [dstLabel, setDstLabel] = useState(0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Mapping Config</CardTitle>
        <CardDescription>
          Route each button or axis on the Bluetooth controller to one on the
          wired interface.
        </CardDescription>
        <CardAction>
          <DocLink href={docs.mappingCfg.href}>{docs.mappingCfg.label}</DocLink>
        </CardAction>
      </CardHeader>
      <CardContent>
        <FieldGroup className={FIELD_GRID}>
          <Field>
            <FieldLabel htmlFor="inputSelect">
              Select Bluetooth device
            </FieldLabel>
            <NativeSelect
              className="w-full"
              id="inputSelect"
              disabled={locked}
              value={cfgId}
              onChange={(e) => setCfgId(Number(e.target.value))}
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
      </CardContent>
      <QueryBoundary fallback={<MappingCfgSkeleton />} resetKey={scope}>
        <MappingCfgForm
          key={scope}
          cfgId={cfgId}
          srcLabel={srcLabel}
          dstLabel={dstLabel}
          locked={locked}
        />
      </QueryBoundary>
    </Card>
  );
}

interface MappingCfgFormProps {
  cfgId: number;
  srcLabel: number;
  dstLabel: number;
  locked: boolean;
}

function MappingCfgForm({
  cfgId,
  srcLabel,
  dstLabel,
  locked,
}: MappingCfgFormProps) {
  const [mappings, setMappings] = useDraft(useInputCfg(cfgId).data);

  const saveMutation = useSaveInputCfg();

  function addRow() {
    if (mappings.length < maxMapping) {
      setMappings([...mappings, defaultRow()]);
    }
  }

  function deleteRow(i: number) {
    setMappings(mappings.filter((_, idx) => idx !== i));
  }

  function updateRow(i: number, field: keyof MappingRow, value: number) {
    setMappings(
      mappings.map((row, idx) =>
        idx === i ? { ...row, [field]: value } : row,
      ),
    );
  }

  return (
    <>
      <CardContent className="gap-6">
        <fieldset disabled={locked} className="contents">
          <MappingTable>
            {mappings.map((row, i) => (
              <div key={i} className={MAPPING_ROW}>
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
                      <FieldOptions
                        field={field}
                        label={field === "src" ? srcLabel : dstLabel}
                      />
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
                      onClick={() => deleteRow(i)}
                    >
                      <Trash2Icon />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </MappingTable>

          <div className="flex items-center justify-between gap-3">
            <Button
              variant="outline"
              onClick={addRow}
              disabled={mappings.length >= maxMapping}
            >
              <PlusIcon data-icon="inline-start" />
              Add mapping
            </Button>
            <span className="text-muted-foreground text-xs tabular-nums">
              {mappings.length} / {maxMapping}
            </span>
          </div>
        </fieldset>

        {saveMutation.isSuccess && (
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
        <Button
          disabled={locked}
          onClick={() => saveMutation.mutate({ cfgId, rows: mappings })}
        >
          Save
        </Button>
      </CardFooter>
    </>
  );
}

/** Column headers and row container, shared by the form and its skeleton. */
function MappingTable({ children }: { children: ReactNode }) {
  return (
    <div className="lg:overflow-x-auto">
      <div className="lg:min-w-[60rem]">
        {/* Column headers stand in for the per-cell labels once the rows
            line up as a table. */}
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
          {children}
        </div>
      </div>
    </div>
  );
}

function FieldOptions({
  field,
  label,
}: {
  field: keyof MappingRow;
  label: number;
}) {
  switch (field) {
    case "src":
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

function MappingCfgSkeleton() {
  return (
    <>
      <CardContent className="gap-6" aria-busy>
        <MappingTable>
          {Array.from({ length: SKELETON_ROWS }, (_, i) => (
            <div key={i} className={MAPPING_ROW}>
              {FIELDS.map((field) => (
                <div key={field} className="min-w-0">
                  <Skeleton className="mb-2 h-3.5 w-14 lg:hidden" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ))}
        </MappingTable>
        <div className="flex items-center justify-between gap-3">
          <Skeleton className="h-9 w-36" />
          <Skeleton className="h-4 w-14" />
        </div>
      </CardContent>
      <SaveFooterSkeleton />
    </>
  );
}

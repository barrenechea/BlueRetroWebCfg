import { CircleCheckIcon, InfoIcon } from "lucide-react";
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
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

import { devCfg, accCfg, maxOutput } from "../../lib/constants";
import { docs } from "../../lib/docs";
import {
  mutationKeys,
  useCfgLocked,
  useSaveOutputCfg,
} from "../../lib/mutations";
import { useOutputCfg } from "../../lib/queries";
import { useDraft } from "../../lib/useDraft";
import { useBlueRetro } from "../BlueRetroContext";
import { DocLink } from "../DocLink";
import { FIELD_GRID, FieldSkeleton, SaveFooterSkeleton } from "../FormSkeleton";
import { QueryBoundary } from "../QueryBoundary";

const MOUSE_MODE = 3;

/**
 * The output picker sits outside the boundary, so switching outputs only
 * suspends the fields below it.
 */
export function OutputCfgCard() {
  const { currentCfg } = useBlueRetro();
  const [cfgId, setCfgId] = useState(0);
  const scope = `${currentCfg}:${cfgId}`;
  const locked = useCfgLocked(mutationKeys.saveOutputCfg);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Output Config</CardTitle>
        <CardDescription>
          Device mode and accessories for one wired output.
        </CardDescription>
        <CardAction>
          <DocLink href={docs.outputCfg.href}>{docs.outputCfg.label}</DocLink>
        </CardAction>
      </CardHeader>
      <CardContent>
        <FieldGroup className={FIELD_GRID}>
          <Field>
            <FieldLabel htmlFor="outputSelect">Select output</FieldLabel>
            <NativeSelect
              className="w-full"
              id="outputSelect"
              disabled={locked}
              value={cfgId}
              onChange={(e) => setCfgId(Number(e.target.value))}
            >
              {Array.from({ length: maxOutput }, (_, i) => (
                <NativeSelectOption key={i} value={i}>
                  Output {i + 1}
                </NativeSelectOption>
              ))}
            </NativeSelect>
          </Field>
        </FieldGroup>
      </CardContent>
      <QueryBoundary fallback={<OutputCfgSkeleton />} resetKey={scope}>
        <OutputCfgForm key={scope} cfgId={cfgId} locked={locked} />
      </QueryBoundary>
    </Card>
  );
}

function OutputCfgForm({ cfgId, locked }: { cfgId: number; locked: boolean }) {
  const [cfg, setCfg] = useDraft(useOutputCfg(cfgId).data);

  const saveMutation = useSaveOutputCfg(cfgId);

  return (
    <>
      <CardContent className="gap-6">
        <fieldset disabled={locked} className="contents">
          <FieldGroup className={FIELD_GRID}>
            <Field>
              <FieldLabel htmlFor="outputMode">Mode</FieldLabel>
              <NativeSelect
                className="w-full"
                id="outputMode"
                value={cfg.mode}
                onChange={(e) =>
                  setCfg({ ...cfg, mode: Number(e.target.value) })
                }
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
                value={cfg.acc}
                onChange={(e) =>
                  setCfg({ ...cfg, acc: Number(e.target.value) })
                }
              >
                {accCfg.map((s, i) => (
                  <NativeSelectOption key={i} value={i}>
                    {s}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
          </FieldGroup>
        </fieldset>

        {saveMutation.isSuccess && (
          <Alert>
            <CircleCheckIcon />
            <AlertTitle>Config saved</AlertTitle>
            <AlertDescription>
              Power cycle the BlueRetro adapter for the Mode change to take
              effect.
            </AlertDescription>
          </Alert>
        )}
        {saveMutation.isSuccess &&
          saveMutation.variables.mode == MOUSE_MODE && (
            <Alert>
              <InfoIcon />
              <AlertTitle>
                Mouse mode requires the &lt;Default Mouse&gt; preset.
              </AlertTitle>
            </Alert>
          )}
      </CardContent>
      <CardFooter className="border-t">
        <Button disabled={locked} onClick={() => saveMutation.mutate(cfg)}>
          Save
        </Button>
      </CardFooter>
    </>
  );
}

function OutputCfgSkeleton() {
  return (
    <>
      <CardContent aria-busy>
        <div className={FIELD_GRID}>
          <FieldSkeleton />
          <FieldSkeleton />
        </div>
      </CardContent>
      <SaveFooterSkeleton />
    </>
  );
}

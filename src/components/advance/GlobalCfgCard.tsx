import { CircleCheckIcon } from "lucide-react";

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

import { globalCfgFieldCount } from "../../lib/blueretro/globalCfg";
import { systemCfg, multitapCfg, inquiryMode } from "../../lib/constants";
import { docs } from "../../lib/docs";
import {
  mutationKeys,
  useCfgLocked,
  useSaveGlobalCfg,
} from "../../lib/mutations";
import { useGlobalCfg } from "../../lib/queries";
import { useDraft } from "../../lib/useDraft";
import { useBlueRetro } from "../BlueRetroContext";
import { DocLink } from "../DocLink";
import { FIELD_GRID, FieldSkeleton, SaveFooterSkeleton } from "../FormSkeleton";
import { QueryBoundary } from "../QueryBoundary";

export function GlobalCfgCard() {
  const { currentCfg } = useBlueRetro();
  const locked = useCfgLocked(mutationKeys.saveGlobalCfg);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Global Config</CardTitle>
        <CardDescription>Applies to the whole adapter.</CardDescription>
        <CardAction>
          <DocLink href={docs.globalCfg.href}>{docs.globalCfg.label}</DocLink>
        </CardAction>
      </CardHeader>
      <QueryBoundary fallback={<GlobalCfgSkeleton />} resetKey={currentCfg}>
        <GlobalCfgForm key={currentCfg} locked={locked} />
      </QueryBoundary>
    </Card>
  );
}

function GlobalCfgForm({ locked }: { locked: boolean }) {
  const fieldCount = globalCfgFieldCount(useBlueRetro().apiVersion);
  const [cfg, setCfg] = useDraft(useGlobalCfg().data);

  const saveMutation = useSaveGlobalCfg();

  return (
    <>
      <CardContent className="gap-6">
        <fieldset disabled={locked} className="contents">
          <FieldGroup className={FIELD_GRID}>
            <Field>
              <FieldLabel htmlFor="systemCfg">System</FieldLabel>
              <NativeSelect
                className="w-full"
                id="systemCfg"
                value={cfg.system}
                onChange={(e) =>
                  setCfg({ ...cfg, system: Number(e.target.value) })
                }
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
                value={cfg.multitap}
                onChange={(e) =>
                  setCfg({ ...cfg, multitap: Number(e.target.value) })
                }
              >
                {multitapCfg.map((s, i) => (
                  <NativeSelectOption key={i} value={i}>
                    {s}
                  </NativeSelectOption>
                ))}
              </NativeSelect>
            </Field>
            {fieldCount > 2 && (
              <Field>
                <FieldLabel htmlFor="inquiryMode">Inquiry mode</FieldLabel>
                <NativeSelect
                  className="w-full"
                  id="inquiryMode"
                  value={cfg.inquiry}
                  onChange={(e) =>
                    setCfg({ ...cfg, inquiry: Number(e.target.value) })
                  }
                >
                  {inquiryMode.map((s, i) => (
                    <NativeSelectOption key={i} value={i}>
                      {s}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            )}
            {fieldCount > 3 && (
              <Field>
                <FieldLabel htmlFor="banksel">Memory Card Bank</FieldLabel>
                <NativeSelect
                  className="w-full"
                  id="banksel"
                  value={cfg.banksel}
                  onChange={(e) =>
                    setCfg({ ...cfg, banksel: Number(e.target.value) })
                  }
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
        </fieldset>

        {saveMutation.isSuccess && (
          <Alert>
            <CircleCheckIcon />
            <AlertTitle>Config saved</AlertTitle>
            <AlertDescription>
              Power cycle the BlueRetro adapter for the change to take effect.
            </AlertDescription>
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

function GlobalCfgSkeleton() {
  const fieldCount = globalCfgFieldCount(useBlueRetro().apiVersion);
  return (
    <>
      <CardContent aria-busy>
        <div className={FIELD_GRID}>
          {Array.from({ length: fieldCount }, (_, i) => (
            <FieldSkeleton key={i} />
          ))}
        </div>
      </CardContent>
      <SaveFooterSkeleton />
    </>
  );
}

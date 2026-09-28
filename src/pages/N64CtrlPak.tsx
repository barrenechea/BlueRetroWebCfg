import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import {
  NativeSelect,
  NativeSelectOption,
} from "@/components/ui/native-select";

import { useBlueRetro } from "../components/BlueRetroContext";
import { NotConnected, PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { makeFormattedPak } from "../lib/blueretro/makeFormattedPak";
import { docs, links } from "../lib/docs";
import { log } from "../lib/logger";
import { useDownloadCtrlPak, useWriteCtrlPak } from "../lib/mutations";

export function N64CtrlPak() {
  const { connected } = useBlueRetro();
  const [pak, setPak] = useState(0);
  const readMutation = useDownloadCtrlPak();
  const writeMutation = useWriteCtrlPak();
  const transferring = readMutation.isRunning || writeMutation.isRunning;

  function pakWrite() {
    const reader = new FileReader();
    reader.onerror = () => {
      log("An error occurred reading this file.");
    };
    reader.onabort = function () {
      log("File read cancelled");
    };
    reader.onload = function () {
      writeMutation.mutate({ pak, data: reader.result as ArrayBuffer });
    };
    reader.readAsArrayBuffer(
      (document.getElementById("pakFile") as HTMLInputElement).files![0],
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="N64 Controller Pak Manager"
        description="Read, write and format BlueRetro's four emulated controller paks."
        doc={docs.n64CtrlPak}
      />

      {!connected && <NotConnected what="manage the controller paks" />}

      {connected && transferring && (
        <Card>
          <CardContent>
            <ProgressBar
              label={readMutation.isRunning ? "Reading pak" : "Writing pak"}
            />
          </CardContent>
          <CardFooter className="border-t">
            <Button
              variant="outline"
              onClick={() =>
                (readMutation.isRunning ? readMutation : writeMutation).cancel()
              }
            >
              Cancel
            </Button>
          </CardFooter>
        </Card>
      )}

      {connected && !transferring && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>Pak bank</CardTitle>
            </CardHeader>
            <CardContent>
              <Field className="max-w-xs">
                <FieldLabel htmlFor="pakSelect">
                  Select BlueRetro controller pak bank
                </FieldLabel>
                <NativeSelect
                  className="w-full"
                  id="pakSelect"
                  value={pak}
                  onChange={(e) => setPak(Number(e.target.value))}
                >
                  {[0, 1, 2, 3].map((i) => (
                    <NativeSelectOption key={i} value={i}>
                      Pak {i + 1}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
            </CardContent>
            <CardFooter className="gap-2 border-t">
              <Button onClick={() => readMutation.mutate(pak)}>Read</Button>
              <Button
                variant="outline"
                onClick={() =>
                  writeMutation.mutate({ pak, data: makeFormattedPak().buffer })
                }
              >
                Format
              </Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select .MPK file to write</CardTitle>
              <CardDescription>
                Use{" "}
                <a
                  href={links.mempak}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  {links.mempak}
                </a>{" "}
                (by{" "}
                <a
                  href={links.mempakAuthor}
                  target="_blank"
                  rel="noreferrer"
                  className="text-primary underline-offset-4 hover:underline"
                >
                  bryc
                </a>
                ) to manage the content of .MPK files.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input type="file" id="pakFile" accept=".mpk" />
            </CardContent>
            <CardFooter className="gap-2 border-t">
              <Button onClick={pakWrite}>Write</Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}

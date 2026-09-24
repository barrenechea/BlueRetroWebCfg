import { useMutation } from "@tanstack/react-query";
import { useRef, useState } from "react";

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
import { downloadFile } from "../lib/blueretro/downloadFile";
import { gattSerial } from "../lib/blueretro/gattSerial";
import { makeFormattedPak } from "../lib/blueretro/makeFormattedPak";
import { n64ReadFile } from "../lib/blueretro/n64ReadFile";
import { n64WriteFile } from "../lib/blueretro/n64WriteFile";
import { pakSize } from "../lib/constants";
import { docs, links } from "../lib/docs";
import { log } from "../lib/logger";
import { setProgress } from "../lib/progress";
import type { CancelRef } from "../lib/types";

export function N64CtrlPak() {
  const { connected, serviceRef } = useBlueRetro();
  const [pak, setPak] = useState(0);
  // Real ref object so the recursive readers/writers' cancel check works
  // (the old code passed a plain number, which made Cancel a no-op).
  const cancelRef = useRef<CancelRef>({ current: 0 });

  const pakReadMutation = useMutation({
    mutationFn: () =>
      gattSerial(() =>
        n64ReadFile(serviceRef.current!, pak, setProgress, cancelRef.current),
      ),
    onSuccess: (value) => {
      downloadFile(
        new Blob([value.buffer as ArrayBuffer], { type: "application/mpk" }),
        "ctrl_pak" + (pak + 1) + ".mpk",
      );
    },
    onError: (error) => log("Argh! " + error),
    onSettled: () => {
      cancelRef.current.current = 0;
    },
  });

  const pakWriteMutation = useMutation({
    mutationFn: (data: ArrayBuffer) =>
      gattSerial(() =>
        n64WriteFile(
          serviceRef.current!,
          data,
          pak,
          setProgress,
          cancelRef.current,
        ),
      ),
    onError: (error) => log("Argh! " + error),
    onSettled: () => {
      cancelRef.current.current = 0;
    },
  });

  const transferring = pakReadMutation.isPending || pakWriteMutation.isPending;

  function abortFileTransfer() {
    cancelRef.current.current = 1;
  }

  function pakRead() {
    pakReadMutation.mutate();
  }

  function pakWrite() {
    const reader = new FileReader();
    reader.onerror = () => {
      log("An error occurred reading this file.");
    };
    reader.onabort = function () {
      log("File read cancelled");
    };
    reader.onload = function () {
      pakWriteMutation.mutate((reader.result as ArrayBuffer).slice(0, pakSize));
    };
    reader.readAsArrayBuffer(
      (document.getElementById("pakFile") as HTMLInputElement).files![0],
    );
  }

  function pakFormat() {
    pakWriteMutation.mutate(makeFormattedPak().buffer);
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
              label={pakReadMutation.isPending ? "Reading pak" : "Writing pak"}
            />
          </CardContent>
          <CardFooter className="border-t">
            <Button variant="outline" onClick={abortFileTransfer}>
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
              <Button onClick={pakRead}>Read</Button>
              <Button variant="outline" onClick={pakFormat}>
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

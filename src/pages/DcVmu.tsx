import { useMutation } from "@tanstack/react-query";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

import { useBlueRetro } from "../components/BlueRetroContext";
import { NotConnected, PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { dcReadFile } from "../lib/blueretro/dcReadFile";
import { dcWriteFile } from "../lib/blueretro/dcWriteFile";
import { downloadFile } from "../lib/blueretro/downloadFile";
import { gattSerial } from "../lib/blueretro/gattSerial";
import { vmuSize } from "../lib/constants";
import { docs } from "../lib/docs";
import { log } from "../lib/logger";
import { setProgress } from "../lib/progress";
import type { CancelRef } from "../lib/types";

function swapBytes(data: ArrayBuffer) {
  const view = new DataView(data);
  for (let i = 0; i < vmuSize; i += 4) {
    view.setUint32(i, view.getUint32(i), true);
  }
}

export function DcVmu() {
  const { connected, serviceRef } = useBlueRetro();
  // Real ref object so the recursive readers/writers' cancel check works
  // (the old code passed a plain number, which made Cancel a no-op).
  const cancelRef = useRef<CancelRef>({ current: 0 });

  const vmuReadMutation = useMutation({
    mutationFn: () =>
      gattSerial(() =>
        dcReadFile(serviceRef.current!, setProgress, cancelRef.current),
      ),
    onSuccess: (value) => {
      swapBytes(value.buffer as ArrayBuffer);
      downloadFile(
        new Blob([value.buffer as ArrayBuffer], { type: "application/bin" }),
        "vmu.bin",
      );
    },
    onError: (error) => log("Argh! " + error),
    onSettled: () => {
      cancelRef.current.current = 0;
    },
  });

  const vmuWriteMutation = useMutation({
    mutationFn: (data: ArrayBuffer) =>
      gattSerial(() =>
        dcWriteFile(serviceRef.current!, data, setProgress, cancelRef.current),
      ),
    onError: (error) => log("Argh! " + error),
    onSettled: () => {
      cancelRef.current.current = 0;
    },
  });

  const transferring = vmuReadMutation.isPending || vmuWriteMutation.isPending;

  function abortFileTransfer() {
    cancelRef.current.current = 1;
  }

  function pakRead() {
    vmuReadMutation.mutate();
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
      const data = (reader.result as ArrayBuffer).slice(0, vmuSize);
      swapBytes(data);
      vmuWriteMutation.mutate(data);
    };
    // Read in the image file as a binary string.
    reader.readAsArrayBuffer(
      (document.getElementById("pakFile") as HTMLInputElement).files![0],
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="DC VMU Manager"
        description="Read and write BlueRetro's emulated VMU."
        doc={docs.dcVmu}
      />

      {!connected && <NotConnected what="manage the VMU" />}

      {connected && transferring && (
        <Card>
          <CardContent>
            <ProgressBar
              label={vmuReadMutation.isPending ? "Reading VMU" : "Writing VMU"}
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
              <CardTitle>Read VMU</CardTitle>
              <CardDescription>
                Download the current VMU content as vmu.bin.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={pakRead}>Read</Button>
            </CardFooter>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Select .BIN file to write</CardTitle>
              <CardDescription>
                Write a saved VMU back onto the adapter.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input type="file" id="pakFile" accept=".bin" />
            </CardContent>
            <CardFooter className="border-t">
              <Button onClick={pakWrite}>Write</Button>
            </CardFooter>
          </Card>
        </>
      )}
    </div>
  );
}

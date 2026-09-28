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
import { docs } from "../lib/docs";
import { log } from "../lib/logger";
import { useDownloadVmu, useWriteVmu } from "../lib/mutations";

export function DcVmu() {
  const { connected } = useBlueRetro();
  const readMutation = useDownloadVmu();
  const writeMutation = useWriteVmu();
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
      writeMutation.mutate(reader.result as ArrayBuffer);
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
              label={readMutation.isRunning ? "Reading VMU" : "Writing VMU"}
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
              <CardTitle>Read VMU</CardTitle>
              <CardDescription>
                Download the current VMU content as vmu.bin.
              </CardDescription>
            </CardHeader>
            <CardFooter>
              <Button onClick={() => readMutation.mutate()}>Read</Button>
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

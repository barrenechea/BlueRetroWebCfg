import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { useBlueRetro } from "../components/BlueRetroContext";
import { NotConnected, PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { dcReadFile } from "../lib/blueretro/dcReadFile";
import { downloadFile } from "../lib/blueretro/downloadFile";
import { docs } from "../lib/docs";
import { log } from "../lib/logger";
import { setProgress } from "../lib/progress";
import type { CancelRef } from "../lib/types";

export function Debug() {
  const { connected, serviceRef } = useBlueRetro();
  const [transferring, setTransferring] = useState(false);
  // Real ref object so the recursive reader's cancel check works (the old
  // code passed a plain number, which made Cancel a no-op).
  const cancelRef = useRef<CancelRef>({ current: 0 });

  function abortFileTransfer() {
    cancelRef.current.current = 1;
  }

  async function pakRead() {
    setTransferring(true);
    try {
      const value = await dcReadFile(
        serviceRef.current!,
        setProgress,
        cancelRef.current,
      );
      downloadFile(
        new Blob([value.buffer as ArrayBuffer], { type: "application/bin" }),
        "br_debug_trace.bin",
      );
    } catch (error) {
      log("Argh! " + error);
      cancelRef.current.current = 0;
    }
    setTransferring(false);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Debug Trace"
        description="Download the adapter's trace buffer to attach to a bug report."
        doc={docs.debugTrace}
      />

      {!connected && <NotConnected what="download a debug trace" />}

      {connected && (
        <Card>
          {transferring ? (
            <>
              <CardContent>
                <ProgressBar label="Downloading debug trace" />
              </CardContent>
              <CardFooter className="border-t">
                <Button variant="outline" onClick={abortFileTransfer}>
                  Cancel
                </Button>
              </CardFooter>
            </>
          ) : (
            <CardFooter>
              <Button onClick={() => void pakRead()}>
                Download debug trace
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter } from "@/components/ui/card";

import { useBlueRetro } from "../components/BlueRetroContext";
import { NotConnected, PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import { docs } from "../lib/docs";
import { useDownloadDebugTrace } from "../lib/mutations";

export function Debug() {
  const { connected } = useBlueRetro();
  const traceMutation = useDownloadDebugTrace();

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
          {traceMutation.isRunning ? (
            <>
              <CardContent>
                <ProgressBar label="Downloading debug trace" />
              </CardContent>
              <CardFooter className="border-t">
                <Button variant="outline" onClick={traceMutation.cancel}>
                  Cancel
                </Button>
              </CardFooter>
            </>
          ) : (
            <CardFooter>
              <Button onClick={() => traceMutation.mutate()}>
                Download debug trace
              </Button>
            </CardFooter>
          )}
        </Card>
      )}
    </div>
  );
}

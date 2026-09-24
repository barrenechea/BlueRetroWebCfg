import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { TriangleAlertIcon } from "lucide-react";
import { useRef } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
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
import { gattSerial } from "../lib/blueretro/gattSerial";
import { getStringCmd } from "../lib/blueretro/getStringCmd";
import { otaWriteFirmware } from "../lib/blueretro/otaWriteFirmware";
import { cfg_cmd_get_fw_name } from "../lib/constants";
import { docs } from "../lib/docs";
import { log } from "../lib/logger";
import { setProgress } from "../lib/progress";
import type { CancelRef } from "../lib/types";

export function Ota() {
  const { connected, info, serviceRef } = useBlueRetro();
  const queryClient = useQueryClient();
  // Real ref object so the recursive writer's cancel check works (the old
  // code passed a plain number, which made Cancel a no-op).
  const cancelRef = useRef<CancelRef>({ current: 0 });

  const fwQuery = useQuery({
    queryKey: ["ota", "fw"],
    enabled: connected && info !== null,
    queryFn: () =>
      gattSerial(async () => {
        const appVer = info!.appVer;
        const appVerIs18x = appVer.indexOf("v1.8") != -1;
        const appVerBogus = appVer.indexOf("v") == -1;
        let appName = "";
        if (!appVerIs18x && !appVerBogus) {
          appName = await getStringCmd(
            serviceRef.current!,
            cfg_cmd_get_fw_name,
          );
        }
        const appVerIsHw2 = appVer.indexOf("hw2") != -1;
        const appNameIsHw2 = appName.indexOf("hw2") != -1;
        log(
          "app_ver_is_hw2: " +
            appVerIsHw2 +
            " app_name_is_hw2: " +
            appNameIsHw2,
        );
        return { fwIsHw2: appVerIsHw2 || appNameIsHw2 ? 1 : 0 };
      }),
  });

  const fwMutation = useMutation({
    mutationFn: (data: ArrayBuffer) =>
      gattSerial(() =>
        otaWriteFirmware(
          serviceRef.current!,
          data,
          setProgress,
          cancelRef.current,
        ),
      ),
    onSuccess: () => {
      // The firmware changed: refetch the cached fw info.
      void queryClient.invalidateQueries({ queryKey: ["ota"] });
    },
    onError: (error) => log("Argh! " + error),
    onSettled: () => {
      cancelRef.current.current = 0;
    },
  });

  function abortFwUpdate() {
    cancelRef.current.current = 1;
  }

  function firmwareUpdate() {
    const reader = new FileReader();
    reader.onerror = () => {
      log("An error occurred reading this file.");
    };
    reader.onabort = function () {
      log("File read cancelled");
    };
    reader.onload = function () {
      const decoder = new TextDecoder("utf-8");
      const header = decoder.decode(
        (reader.result as ArrayBuffer).slice(0, 256),
      );
      const new_fw_is_hw2 = header.indexOf("hw2") != -1;
      log("new_fw_is_hw2: " + new_fw_is_hw2);
      if (fwQuery.data?.fwIsHw2 == Number(new_fw_is_hw2)) {
        fwMutation.mutate(reader.result as ArrayBuffer);
      } else {
        log("Hardware and firmware mismatch!");
      }
    };

    const file = (document.getElementById("fwFile") as HTMLInputElement).value;
    const ext = file.match(/\.[0-9a-z]+$/i);

    if (ext && ext[0] == ".bin") {
      // Read in the image file as a binary string.
      reader.readAsArrayBuffer(
        (document.getElementById("fwFile") as HTMLInputElement).files![0],
      );
    } else {
      log("Invalid file format. Make sure to unzip the archive!");
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="OTA FW Update"
        description="Flash a new firmware onto the adapter over Bluetooth."
        doc={docs.ota}
      />

      {!connected && <NotConnected what="update the firmware" />}

      {connected && (
        <Card>
          <CardHeader>
            <CardTitle>Select firmware</CardTitle>
            <CardDescription>
              Pick the .bin for your hardware revision. Make sure to unzip the
              archive first.
            </CardDescription>
          </CardHeader>
          {fwMutation.isPending ? (
            <>
              <CardContent className="gap-6">
                <ProgressBar label="Flashing firmware" />
                <Alert variant="destructive">
                  <TriangleAlertIcon />
                  <AlertTitle>Do not close this page</AlertTitle>
                  <AlertDescription>
                    Keep this page open and the adapter powered until the update
                    completes.
                  </AlertDescription>
                </Alert>
              </CardContent>
              <CardFooter className="border-t">
                <Button variant="outline" onClick={abortFwUpdate}>
                  Cancel
                </Button>
              </CardFooter>
            </>
          ) : (
            <>
              <CardContent>
                <Input type="file" id="fwFile" name="fw.bin" accept=".bin" />
              </CardContent>
              <CardFooter className="gap-3 border-t">
                <Button onClick={firmwareUpdate}>Update Firmware</Button>
                <span className="text-muted-foreground text-xs">
                  The firmware is checked against the adapter hardware revision
                  before flashing.
                </span>
              </CardFooter>
            </>
          )}
        </Card>
      )}
    </div>
  );
}

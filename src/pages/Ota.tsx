import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "cn";
import { TriangleAlertIcon } from "lucide-react";
import { useRef, useState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { useBlueRetro } from "../components/BlueRetroContext";
import { NotConnected, PageHeader } from "../components/PageHeader";
import { ProgressBar } from "../components/ProgressBar";
import {
  compareHardware,
  compareSystem,
  type FwCheck,
  type FwIdentity,
  fwSystemLabel,
  parseAdapterIdentity,
  readFwImage,
} from "../lib/blueretro/fwIdentity";
import { gattSerial } from "../lib/blueretro/gattSerial";
import { getStringCmd } from "../lib/blueretro/getStringCmd";
import { otaWriteFirmware } from "../lib/blueretro/otaWriteFirmware";
import { cfg_cmd_get_fw_name } from "../lib/constants";
import { docs } from "../lib/docs";
import { log } from "../lib/logger";
import { setProgress } from "../lib/progress";
import type { CancelRef } from "../lib/types";

interface FwSide {
  identity: FwIdentity;
  version: string;
}

interface Mismatch {
  data: ArrayBuffer;
  adapter: FwSide;
  file: FwSide;
  hardware: FwCheck;
  system: FwCheck;
}

export function Ota() {
  const { connected, info, serviceRef } = useBlueRetro();
  const queryClient = useQueryClient();
  // Real ref object so the recursive writer's cancel check works (the old
  // code passed a plain number, which made Cancel a no-op).
  const cancelRef = useRef<CancelRef>({ current: 0 });
  // Kept separate from `mismatchOpen` so the dialog keeps its content while
  // it animates closed.
  const [mismatch, setMismatch] = useState<Mismatch | null>(null);
  const [mismatchOpen, setMismatchOpen] = useState(false);

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
        const identity = parseAdapterIdentity(appName, appVer);
        log(
          "app_name: " +
            JSON.stringify(appName.replace(/\0/g, "")) +
            " hw: " +
            identity.hardware +
            " systems: " +
            identity.systems,
        );
        return identity;
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

  function flashAnyway() {
    setMismatchOpen(false);
    if (mismatch) fwMutation.mutate(mismatch.data);
  }

  function firmwareUpdate() {
    const input = document.getElementById("fwFile") as HTMLInputElement;
    const reader = new FileReader();
    reader.onerror = () => {
      log("An error occurred reading this file.");
    };
    reader.onabort = function () {
      log("File read cancelled");
    };
    reader.onload = function () {
      const data = reader.result as ArrayBuffer;
      const image = readFwImage(data);
      const file = image.identity;
      log(
        "new_fw_name: " +
          JSON.stringify(image.projectName) +
          " hw: " +
          file.hardware +
          " systems: " +
          file.systems,
      );
      const adapter = fwQuery.data ?? parseAdapterIdentity("", "");
      const hardware = compareHardware(adapter, file);
      const system = compareSystem(adapter, file);
      if (hardware == "match" && system == "match") {
        fwMutation.mutate(data);
      } else {
        log("Hardware: " + hardware + ", system: " + system);
        setMismatch({
          data,
          adapter: { identity: adapter, version: info?.appVer ?? "" },
          file: { identity: file, version: image.version },
          hardware,
          system,
        });
        setMismatchOpen(true);
      }
    };

    const ext = input.value.match(/\.[0-9a-z]+$/i);

    if (ext && ext[0] == ".bin") {
      // Read in the image file as a binary string.
      reader.readAsArrayBuffer(input.files![0]);
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

      <Dialog
        open={mismatchOpen}
        onOpenChange={setMismatchOpen}
        onOpenChangeComplete={(open) => {
          if (!open) setMismatch(null);
        }}
      >
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>
              {mismatch && !hasDiff(mismatch)
                ? "Can't verify this firmware"
                : "Firmware doesn't match this adapter"}
            </DialogTitle>
            <DialogDescription>
              {mismatch && mismatchDescription(mismatch)}
            </DialogDescription>
          </DialogHeader>
          {mismatch && <MismatchTable mismatch={mismatch} />}
          <DialogFooter>
            <DialogClose render={<Button variant="outline" />}>
              Cancel
            </DialogClose>
            <Button
              variant={
                mismatch && hasDiff(mismatch) ? "destructive" : "default"
              }
              onClick={flashAnyway}
            >
              Flash anyway
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function hasDiff(mismatch: Mismatch) {
  return mismatch.hardware == "differs" || mismatch.system == "differs";
}

function mismatchDescription(mismatch: Mismatch) {
  if (mismatch.hardware == "differs") {
    return "The selected .bin was built for a different hardware revision. Flashing it may brick the adapter.";
  }
  if (mismatch.system == "differs") {
    return "The selected .bin was built for a different system. The adapter won't work with its current console until you flash the right firmware again.";
  }
  const unverified = [
    mismatch.hardware == "unknown" && "hardware revision",
    mismatch.system == "unknown" && "system",
  ].filter(Boolean);
  return `The ${unverified.join(" and ")} couldn't be confirmed, which is common with third-party builds and older firmware. Only flash it if you're sure it's the right firmware for this adapter.`;
}

function MismatchTable({ mismatch }: { mismatch: Mismatch }) {
  const { adapter, file } = mismatch;
  const rows: {
    label: string;
    adapter: string | null;
    file: string | null;
    check?: FwCheck;
  }[] = [
    {
      label: "Hardware",
      adapter: adapter.identity.hardware?.toUpperCase() ?? null,
      file: file.identity.hardware?.toUpperCase() ?? null,
      check: mismatch.hardware,
    },
    {
      label: "System",
      adapter: fwSystemLabel(adapter.identity),
      file: fwSystemLabel(file.identity),
      check: mismatch.system,
    },
    // Informational only: a different version is the point of an update.
    { label: "Version", adapter: adapter.version, file: file.version },
  ];

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead />
          <TableHead>Adapter</TableHead>
          <TableHead>Selected file</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((row) => (
          <TableRow key={row.label}>
            <TableCell className="text-muted-foreground">
              <div className="flex items-center gap-2">
                {row.label}
                {row.check == "differs" && (
                  <Badge variant="destructive">Differs</Badge>
                )}
                {row.check == "unknown" && (
                  <Badge variant="outline">Unverified</Badge>
                )}
              </div>
            </TableCell>
            <FwCell value={row.adapter} muted={!row.check} />
            <FwCell
              value={row.file}
              muted={!row.check}
              className={
                row.check == "differs" ? "text-destructive" : undefined
              }
            />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function FwCell({
  value,
  muted,
  className,
}: {
  value: string | null;
  muted?: boolean;
  className?: string;
}) {
  return (
    <TableCell
      className={cn(
        "break-all whitespace-normal",
        value && !muted ? "font-medium" : "text-muted-foreground",
        className,
      )}
    >
      {value || "Unknown"}
    </TableCell>
  );
}

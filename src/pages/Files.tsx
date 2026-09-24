import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemTitle,
} from "@/components/ui/item";

import { useBlueRetro } from "../components/BlueRetroContext";
import { NotConnected, PageHeader } from "../components/PageHeader";
import { gattSerial } from "../lib/blueretro/gattSerial";
import { getGameName } from "../lib/blueretro/getGameName";
import {
  brUuid,
  cfg_cmd_open_dir,
  cfg_cmd_get_file,
  cfg_cmd_close_dir,
  cfg_cmd_del_file,
} from "../lib/constants";
import { docs } from "../lib/docs";
import { log } from "../lib/logger";

interface FileEntry {
  name: string;
  gameId: string | undefined;
}

async function getFiles(service: BluetoothRemoteGATTService) {
  const fileList: FileEntry[] = [];
  const cmd = new Uint8Array(1);
  const cmd_chrc = await service.getCharacteristic(brUuid[7]);
  cmd[0] = cfg_cmd_open_dir;
  await cmd_chrc.writeValue(cmd);
  cmd[0] = cfg_cmd_get_file;
  await cmd_chrc.writeValue(cmd);
  //readFileRecursive
  for (;;) {
    const value = await cmd_chrc.readValue();
    if (value.byteLength > 0) {
      let enc = new TextDecoder("utf-8");
      let filename = enc.decode(value);
      const gamename = await getGameName(filename);
      fileList.push({ name: filename, gameId: gamename });
    } else {
      break;
    }
  }
  cmd[0] = cfg_cmd_close_dir;
  await cmd_chrc.writeValue(cmd);
  return fileList;
}

export function Files() {
  const { connected, serviceRef } = useBlueRetro();
  const queryClient = useQueryClient();

  const filesQuery = useQuery({
    queryKey: ["files"],
    enabled: connected,
    queryFn: () => gattSerial(() => getFiles(serviceRef.current!)),
  });
  const files = filesQuery.data ?? [];

  const deleteMutation = useMutation({
    mutationFn: (filename: string) =>
      gattSerial(async () => {
        const cmd = new Uint8Array(1);
        cmd[0] = cfg_cmd_del_file;
        const enc = new TextEncoder();
        const file = enc.encode(filename);
        const combined = new Uint8Array([...cmd, ...file]);
        const chrc = await serviceRef.current!.getCharacteristic(brUuid[7]);
        await chrc.writeValue(combined);
      }),
    onMutate: (filename) => {
      // Optimistic: remove from the cache before the device confirms.
      queryClient.setQueryData<FileEntry[]>(
        ["files"],
        (prev) => prev?.filter((f) => f.name !== filename) ?? [],
      );
    },
    onError: (error) => {
      log("Argh! " + error);
      // Roll back the optimistic removal by refetching the real list.
      void queryClient.invalidateQueries({ queryKey: ["files"] });
    },
  });

  function deleteFile(filename: string) {
    deleteMutation.mutate(filename);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Files Manager"
        description="Per-GameID configs stored on the adapter."
        doc={docs.files}
      />

      {!connected && <NotConnected what="browse the files stored on it" />}

      {connected && (
        <Card>
          <CardHeader>
            <CardTitle>Files list</CardTitle>
            <CardDescription>
              {filesQuery.isPending
                ? "Reading..."
                : `${files.length} file${files.length === 1 ? "" : "s"} on the adapter`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {files.length === 0 ? (
              <p className="text-muted-foreground py-6 text-center text-sm">
                {filesQuery.isPending ? "Reading..." : "No files stored."}
              </p>
            ) : (
              <ItemGroup className="gap-2">
                {files.map((f) => (
                  <Item key={f.name} variant="outline" size="sm">
                    <ItemContent className="min-w-0">
                      <ItemTitle className="font-mono">{f.name}</ItemTitle>
                      {f.gameId && (
                        <ItemDescription>{f.gameId}</ItemDescription>
                      )}
                    </ItemContent>
                    <ItemActions>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label={`Delete ${f.name}`}
                        title="Delete"
                        onClick={() => deleteFile(f.name)}
                      >
                        <Trash2Icon />
                      </Button>
                    </ItemActions>
                  </Item>
                ))}
              </ItemGroup>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

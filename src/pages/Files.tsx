import { Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
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
import { Skeleton } from "@/components/ui/skeleton";

import { useBlueRetro } from "../components/BlueRetroContext";
import { NotConnected, PageHeader } from "../components/PageHeader";
import { QueryBoundary } from "../components/QueryBoundary";
import { docs } from "../lib/docs";
import { useDeleteFile } from "../lib/mutations";
import { useFiles } from "../lib/queries";

const SKELETON_ITEMS = 3;

export function Files() {
  const { connected } = useBlueRetro();

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
          </CardHeader>
          <QueryBoundary fallback={<FilesSkeleton />}>
            <FilesList />
          </QueryBoundary>
        </Card>
      )}
    </div>
  );
}

function FilesList() {
  const { data: files } = useFiles();

  const deleteMutation = useDeleteFile();

  return (
    <>
      <CardContent>
        {files.length === 0 ? (
          <p className="text-muted-foreground py-6 text-center text-sm">
            No files stored.
          </p>
        ) : (
          <ItemGroup className="gap-2">
            {files.map((f) => (
              <Item key={f.name} variant="outline" size="sm">
                <ItemContent className="min-w-0">
                  <ItemTitle className="font-mono">{f.name}</ItemTitle>
                  {f.gameName && (
                    <ItemDescription>{f.gameName}</ItemDescription>
                  )}
                </ItemContent>
                <ItemActions>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={`Delete ${f.name}`}
                    title="Delete"
                    onClick={() => deleteMutation.mutate(f.name)}
                  >
                    <Trash2Icon />
                  </Button>
                </ItemActions>
              </Item>
            ))}
          </ItemGroup>
        )}
      </CardContent>
      <CardFooter className="text-muted-foreground border-t text-xs tabular-nums">
        {files.length} file{files.length === 1 ? "" : "s"} on the adapter
      </CardFooter>
    </>
  );
}

function FilesSkeleton() {
  return (
    <>
      <CardContent aria-busy>
        <ItemGroup className="gap-2">
          {Array.from({ length: SKELETON_ITEMS }, (_, i) => (
            <Item key={i} variant="outline" size="sm">
              <ItemContent className="gap-1.5">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3.5 w-48" />
              </ItemContent>
              <ItemActions>
                <Skeleton className="size-8" />
              </ItemActions>
            </Item>
          ))}
        </ItemGroup>
      </CardContent>
      <CardFooter className="border-t">
        <Skeleton className="h-4 w-32" />
      </CardFooter>
    </>
  );
}

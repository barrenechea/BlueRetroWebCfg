import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";
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
import { setDeepSleep } from "../lib/blueretro/setDeepSleep";
import { setFactoryReset } from "../lib/blueretro/setFactoryReset";
import { setReset } from "../lib/blueretro/setReset";
import { docs } from "../lib/docs";
import { log } from "../lib/logger";

export function System() {
  const { connected, serviceRef } = useBlueRetro();

  const sleepMutation = useMutation({
    mutationFn: () => gattSerial(() => setDeepSleep(serviceRef.current!)),
    onError: (error) => log("Argh! " + error),
  });
  const resetMutation = useMutation({
    mutationFn: () => gattSerial(() => setReset(serviceRef.current!)),
    onError: (error) => log("Argh! " + error),
  });
  const factoryMutation = useMutation({
    mutationFn: () => gattSerial(() => setFactoryReset(serviceRef.current!)),
    onError: (error) => log("Argh! " + error),
  });

  return (
    <div className="space-y-6">
      <PageHeader
        title="System Manager"
        description="Power and reset commands for the connected BlueRetro adapter."
        doc={docs.system}
      />

      {!connected && <NotConnected what="use the system commands" />}

      {connected && (
        <ItemGroup>
          <Action
            title="Deep Sleep"
            body="Power the adapter down until a controller reconnects."
            button={
              <Button variant="outline" onClick={() => sleepMutation.mutate()}>
                Put in Deep Sleep
              </Button>
            }
          />
          <Action
            title="Reset"
            body="Restart the adapter. Your config is kept."
            button={
              <Button variant="outline" onClick={() => resetMutation.mutate()}>
                Reset
              </Button>
            }
          />
          <Action
            title="Factory Reset"
            body="Erase every stored config and paired device. This cannot be undone."
            button={
              <Button
                variant="destructive"
                onClick={() => {
                  if (
                    window.confirm(
                      "Factory Reset erases every stored config and paired device. Continue?",
                    )
                  ) {
                    factoryMutation.mutate();
                  }
                }}
              >
                Factory Reset
              </Button>
            }
          />
        </ItemGroup>
      )}
    </div>
  );
}

function Action({
  title,
  body,
  button,
}: {
  title: string;
  body: string;
  button: ReactNode;
}) {
  return (
    <Item variant="outline">
      <ItemContent>
        <ItemTitle>{title}</ItemTitle>
        <ItemDescription>{body}</ItemDescription>
      </ItemContent>
      <ItemActions>{button}</ItemActions>
    </Item>
  );
}

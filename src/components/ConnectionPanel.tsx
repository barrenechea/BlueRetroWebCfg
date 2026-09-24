import { TriangleAlertIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

import { links } from "../lib/docs";
import type { ConnInfo } from "../lib/useBlueRetroConnection";
import { useWebBluetoothSupport } from "../lib/useWebBluetoothSupport";

interface ConnectionPanelProps {
  connected: boolean;
  connecting: boolean;
  info: ConnInfo | null;
  gameid: string;
  gamename: string | undefined;
  onConnect: () => void;
  onDisconnect: () => void;
}

const HINT = "Disconnect all controllers from BlueRetro before connecting.";

const UNAVAILABLE = {
  unsupported: {
    hint: "This browser cannot talk to BlueRetro.",
    detail:
      "Use Chrome, Edge, Brave or another Chromium based browser, on desktop or Android. Safari and Firefox do not support Web Bluetooth.",
  },
  insecure: {
    hint: "This page is not served over a secure connection.",
    detail:
      "Web Bluetooth only works on https:// or on localhost. Reopen this page over https:// and try again.",
  },
} as const;

export function ConnectionPanel({
  connected,
  connecting,
  info,
  gameid,
  gamename,
  onConnect,
  onDisconnect,
}: ConnectionPanelProps) {
  const support = useWebBluetoothSupport();
  const unavailable = support === "supported" ? null : UNAVAILABLE[support];

  const newerVersion =
    connected && info && info.latestVer && !info.appVer.includes(info.latestVer)
      ? info.latestVer
      : "";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2.5">
          <StatusDot
            connected={connected}
            connecting={connecting}
            unavailable={unavailable !== null}
          />
          <span className="truncate">
            {unavailable
              ? "Web Bluetooth not available"
              : connected && info?.name
                ? info.name
                : connecting
                  ? "Connecting..."
                  : "Not connected"}
          </span>
        </CardTitle>
        <CardDescription className="truncate">
          {unavailable ? (
            unavailable.hint
          ) : connected ? (
            <DeviceMeta info={info} gameid={gameid} gamename={gamename} />
          ) : (
            HINT
          )}
        </CardDescription>
        <CardAction>
          <Button
            variant={connected ? "outline" : "default"}
            disabled={connecting || unavailable !== null}
            onClick={connected ? onDisconnect : onConnect}
          >
            {connected
              ? "Disconnect BlueRetro"
              : connecting
                ? "Connecting..."
                : "Connect BlueRetro"}
          </Button>
        </CardAction>
      </CardHeader>

      {unavailable && (
        <CardContent>
          <Alert variant="destructive">
            <TriangleAlertIcon />
            <AlertTitle>{unavailable.hint}</AlertTitle>
            <AlertDescription>{unavailable.detail}</AlertDescription>
          </Alert>
        </CardContent>
      )}

      {newerVersion && (
        <CardFooter className="text-muted-foreground gap-1 border-t text-sm">
          Download latest FW
          <span className="text-foreground font-medium">{newerVersion}</span>
          from
          <Button
            variant="link"
            className="h-auto px-0"
            nativeButton={false}
            render={
              <a href={links.releases} target="_blank" rel="noreferrer" />
            }
          >
            GitHub
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

function DeviceMeta({
  info,
  gameid,
  gamename,
}: {
  info: ConnInfo | null;
  gameid: string;
  gamename: string | undefined;
}) {
  const parts: ReactNode[] = [];
  if (info?.bdaddr)
    parts.push(<span className="font-mono">{info.bdaddr}</span>);
  if (info?.appVer) parts.push(info.appVer);
  if (gamename) parts.push(gameid ? `${gamename} (${gameid})` : gamename);

  return (
    <>
      {parts.map((part, i) => (
        <span key={i}>
          {i > 0 && <span className="px-1.5 opacity-50">·</span>}
          {part}
        </span>
      ))}
    </>
  );
}

function StatusDot({
  connected,
  connecting,
  unavailable,
}: {
  connected: boolean;
  connecting: boolean;
  unavailable: boolean;
}) {
  return (
    <span
      className={cn(
        "size-2 shrink-0 rounded-full",
        connected
          ? "bg-primary"
          : unavailable
            ? "bg-destructive"
            : connecting
              ? "bg-muted-foreground animate-pulse"
              : "bg-muted-foreground/40",
      )}
      aria-hidden="true"
    />
  );
}

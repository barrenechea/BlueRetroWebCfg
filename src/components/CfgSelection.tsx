import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import type { DocRef } from "../lib/docs";
import { useCfgLocked, useSwitchCfg } from "../lib/mutations";
import { useBlueRetro } from "./BlueRetroContext";
import { DocLink } from "./DocLink";

export function CfgSelection({ doc }: { doc?: DocRef }) {
  const { gameid, currentCfg } = useBlueRetro();
  const isGlobal = currentCfg === 0;

  const switchMutation = useSwitchCfg();
  const busy = useCfgLocked();

  return (
    <Card>
      <CardHeader>
        <CardTitle>Config Selection</CardTitle>
        {doc && (
          <CardAction>
            <DocLink href={doc.href}>{doc.label}</DocLink>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex-row flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Current config</span>
          <Badge variant="secondary">{isGlobal ? "Global" : "GameID"}</Badge>
        </div>
        {isGlobal ? (
          gameid.length > 0 && (
            <Button
              variant="outline"
              disabled={busy}
              onClick={() => switchMutation.mutate("gameid")}
            >
              Switch to GameID
            </Button>
          )
        ) : (
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => switchMutation.mutate("global")}
          >
            Switch to Global
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

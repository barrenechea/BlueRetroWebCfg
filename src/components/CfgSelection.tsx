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
import { DocLink } from "./DocLink";

interface CfgSelectionProps {
  currentCfg: number;
  hasGameId: boolean;
  doc?: DocRef;
  onSwitchToGameId: () => void;
  onSwitchToGlobal: () => void;
}

export function CfgSelection({
  currentCfg,
  hasGameId,
  doc,
  onSwitchToGameId,
  onSwitchToGlobal,
}: CfgSelectionProps) {
  const isGlobal = currentCfg === 0;

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
          hasGameId && (
            <Button variant="outline" onClick={onSwitchToGameId}>
              Switch to GameID
            </Button>
          )
        ) : (
          <Button variant="outline" onClick={onSwitchToGlobal}>
            Switch to Global
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

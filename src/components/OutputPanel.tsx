import { ChevronRightIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

import { ChromeSamples } from "../lib/logger";

/** The `#content`, `#status` and `#log` ids are written to directly by
 * `ChromeSamples`, so the panel stays mounted while collapsed. */
export function OutputPanel() {
  return (
    <Collapsible defaultOpen render={<Card />}>
      <CardHeader>
        <CardTitle>
          <CollapsibleTrigger
            render={
              <Button variant="ghost" size="sm" className="group -ml-2.5" />
            }
          >
            <ChevronRightIcon
              data-icon="inline-start"
              className="transition-transform group-data-[panel-open]:rotate-90"
            />
            Live Output
          </CollapsibleTrigger>
        </CardTitle>
        <CardAction>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => ChromeSamples.clearLog()}
          >
            Clear
          </Button>
        </CardAction>
      </CardHeader>

      <CollapsibleContent keepMounted>
        <CardContent>
          <div
            id="output"
            className="bg-muted max-h-72 min-h-10 overflow-auto rounded-lg px-3.5 py-3 text-xs"
          >
            <div id="content" className="empty:hidden" />
            <div
              id="status"
              className="text-muted-foreground mb-1.5 italic empty:hidden"
            />
            <pre
              id="log"
              className="text-muted-foreground font-mono leading-relaxed whitespace-pre-wrap empty:hidden"
            />
          </div>
        </CardContent>
      </CollapsibleContent>
    </Collapsible>
  );
}

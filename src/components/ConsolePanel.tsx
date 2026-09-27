import { cn } from "cn";
import {
  CheckIcon,
  CopyIcon,
  TerminalIcon,
  Trash2Icon,
  XIcon,
} from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import { ChromeSamples, type LogLine, useLog } from "../lib/logger";

// Distance from the bottom, in px, within which new lines keep the view
// pinned to the latest output.
const STICK_THRESHOLD = 24;

const timeFormat = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

export function ConsolePanel({
  onClose,
  className,
}: {
  onClose: () => void;
  className?: string;
}) {
  const { lines, status } = useLog();
  const scrollRef = useRef<HTMLDivElement>(null);
  const stickRef = useRef(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const el = scrollRef.current;
    if (el && stickRef.current) el.scrollTop = el.scrollHeight;
  }, [lines, status]);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 1500);
    return () => clearTimeout(timeout);
  }, [copied]);

  function copy() {
    const text = lines
      .map((line) => `${timeFormat.format(line.time)} ${line.text}`)
      .join("\n");
    void navigator.clipboard.writeText(text).then(() => setCopied(true));
  }

  return (
    <aside
      aria-label="Console"
      className={cn("bg-background flex flex-col", className)}
    >
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-3">
        <TerminalIcon className="text-muted-foreground size-4" />
        <h2 className="text-sm font-medium">Console</h2>
        {lines.length > 0 && <Badge variant="secondary">{lines.length}</Badge>}
        <div className="ml-auto flex items-center gap-0.5">
          <PanelAction
            label={copied ? "Copied" : "Copy output"}
            onClick={copy}
            disabled={lines.length == 0}
          >
            {copied ? <CheckIcon /> : <CopyIcon />}
          </PanelAction>
          <PanelAction
            label="Clear output"
            onClick={() => ChromeSamples.clearLog()}
            disabled={lines.length == 0 && !status}
          >
            <Trash2Icon />
          </PanelAction>
          <PanelAction label="Close console" onClick={onClose}>
            <XIcon />
          </PanelAction>
        </div>
      </div>

      <div
        ref={scrollRef}
        onScroll={(event) => {
          const el = event.currentTarget;
          stickRef.current =
            el.scrollHeight - el.scrollTop - el.clientHeight < STICK_THRESHOLD;
        }}
        className="min-h-0 flex-1 overflow-auto py-2"
      >
        {status && (
          <p className="text-destructive bg-destructive/10 mx-3 mb-2 rounded-md px-2.5 py-1.5 text-xs">
            {status}
          </p>
        )}
        {lines.length == 0 && !status ? (
          <Empty className="h-full">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <TerminalIcon />
              </EmptyMedia>
              <EmptyTitle>No output yet</EmptyTitle>
              <EmptyDescription>
                Adapter activity shows up here as it happens.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        ) : (
          <ol className="font-mono text-xs leading-relaxed">
            {lines.map((line) => (
              <ConsoleLine key={line.id} line={line} />
            ))}
          </ol>
        )}
      </div>
    </aside>
  );
}

function ConsoleLine({ line }: { line: LogLine }) {
  return (
    <li
      className={cn(
        "hover:bg-muted/60 flex gap-3 px-3",
        line.error && "text-destructive bg-destructive/5",
      )}
    >
      <time
        dateTime={line.time.toISOString()}
        className="text-muted-foreground/70 shrink-0 tabular-nums select-none"
      >
        {timeFormat.format(line.time)}
      </time>
      <span className="min-w-0 break-words whitespace-pre-wrap">
        {line.text}
      </span>
    </li>
  );
}

function PanelAction({
  label,
  children,
  ...props
}: {
  label: string;
  children: ReactNode;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      title={label}
      aria-label={label}
      {...props}
    >
      {children}
    </Button>
  );
}

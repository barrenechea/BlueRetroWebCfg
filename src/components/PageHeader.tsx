import { BluetoothIcon } from "lucide-react";
import type { ReactNode } from "react";

import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

import type { DocRef } from "../lib/docs";
import { DocLink } from "./DocLink";

interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  doc: DocRef;
}

export function PageHeader({ title, description, doc }: PageHeaderProps) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div className="min-w-0">
        <h1 className="font-heading text-xl font-semibold tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-muted-foreground mt-1 max-w-prose text-sm">
            {description}
          </p>
        )}
      </div>
      <DocLink href={doc.href}>{doc.label}</DocLink>
    </div>
  );
}

export function NotConnected({ what }: { what: string }) {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <BluetoothIcon />
        </EmptyMedia>
        <EmptyTitle>Not connected</EmptyTitle>
        <EmptyDescription>Connect BlueRetro to {what}.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

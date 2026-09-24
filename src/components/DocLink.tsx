import { ExternalLinkIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

export function DocLink({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Button
      variant="outline"
      size="xs"
      nativeButton={false}
      render={<a href={href} target="_blank" rel="noreferrer" />}
    >
      {children}
      <ExternalLinkIcon data-icon="inline-end" />
    </Button>
  );
}

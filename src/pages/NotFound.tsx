import { Link } from "@tanstack/react-router";
import { CompassIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";

export function NotFound() {
  return (
    <Empty className="border">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <CompassIcon />
        </EmptyMedia>
        <EmptyTitle>Page not found</EmptyTitle>
        <EmptyDescription>
          There is no page at this address. Pick one from the menu above.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button variant="outline" nativeButton={false} render={<Link to="/" />}>
          Back to home
        </Button>
      </EmptyContent>
    </Empty>
  );
}

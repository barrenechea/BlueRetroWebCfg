import { CardFooter } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/** Responsive grid for a card's row of fields, shared with their skeletons. */
export const FIELD_GRID = "grid gap-4 sm:grid-cols-2 lg:grid-cols-3";

/** Placeholder sized like a labelled `NativeSelect` in a vertical `Field`. */
export function FieldSkeleton() {
  return (
    <div className="flex flex-col gap-3">
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-9 w-full" />
    </div>
  );
}

export function SaveFooterSkeleton() {
  return (
    <CardFooter className="border-t">
      <Skeleton className="h-9 w-16" />
    </CardFooter>
  );
}

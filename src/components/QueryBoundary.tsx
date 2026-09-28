import {
  QueryErrorResetBoundary,
  useQueryErrorResetBoundary,
} from "@tanstack/react-query";
import { CircleAlertIcon } from "lucide-react";
import { Suspense, useState, type ReactNode } from "react";
import { ErrorBoundary, getErrorMessage } from "react-error-boundary";

import {
  Alert,
  AlertAction,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { CardContent } from "@/components/ui/card";

interface QueryBoundaryProps {
  fallback: ReactNode;
  /** Clears a caught error when it changes, e.g. the picked output. */
  resetKey?: string | number;
  children: ReactNode;
}

/**
 * Wraps a card body that suspends on device reads: `fallback` stands in while
 * they load, and a failed read is caught here with a retry instead of taking
 * down the whole page.
 *
 * TanStack Query won't refetch a query that failed under an error boundary
 * until that boundary's reset flag is set, to avoid retry loops. It is set on
 * Retry, and also whenever this boundary mounts or its `resetKey` changes, so
 * coming back to a read that failed earlier reads it again instead of showing
 * the cached error.
 */
export function QueryBoundary(props: QueryBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      <ResettingBoundary {...props} />
    </QueryErrorResetBoundary>
  );
}

function ResettingBoundary({
  fallback,
  resetKey = 0,
  children,
}: QueryBoundaryProps) {
  const { reset } = useQueryErrorResetBoundary();
  const [resetFor, setResetFor] = useState(() => {
    reset();
    return resetKey;
  });
  if (resetFor !== resetKey) {
    setResetFor(resetKey);
    reset();
  }

  return (
    <ErrorBoundary
      resetKeys={[resetKey]}
      onReset={reset}
      fallbackRender={({ error, resetErrorBoundary }) => (
        <CardContent>
          <Alert variant="destructive">
            <CircleAlertIcon />
            <AlertTitle>Couldn't read from the adapter</AlertTitle>
            <AlertDescription>{getErrorMessage(error)}</AlertDescription>
            <AlertAction>
              <Button
                variant="outline"
                size="sm"
                onClick={() => resetErrorBoundary()}
              >
                Retry
              </Button>
            </AlertAction>
          </Alert>
        </CardContent>
      )}
    >
      <Suspense fallback={fallback}>{children}</Suspense>
    </ErrorBoundary>
  );
}

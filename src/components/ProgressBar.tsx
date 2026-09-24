import { useEffect } from "react";

import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from "@/components/ui/progress";

import { setProgress, useProgress } from "../lib/progress";

export function ProgressBar({ label = "Transferring" }: { label?: string }) {
  const value = useProgress();

  // Each transfer starts from zero, not from where the last one stopped.
  useEffect(() => setProgress(0), []);

  return (
    <Progress value={value}>
      <ProgressLabel>{label}</ProgressLabel>
      <ProgressValue />
    </Progress>
  );
}

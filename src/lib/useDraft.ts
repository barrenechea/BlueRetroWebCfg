import { useState } from "react";

/**
 * Local edits of `source` that re-seed whenever `source` changes identity.
 * TanStack Query's structural sharing keeps the reference stable when a
 * refetch returns the same values, so in-progress edits survive it.
 */
export function useDraft<T>(source: T) {
  const [draft, setDraft] = useState(source);
  const [seeded, setSeeded] = useState(source);
  if (seeded !== source) {
    setSeeded(source);
    setDraft(source);
  }
  return [draft, setDraft] as const;
}

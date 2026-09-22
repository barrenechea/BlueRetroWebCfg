import { createFileRoute } from "@tanstack/react-router";

import { Advance } from "../pages/Advance";

export const Route = createFileRoute("/advance")({
  head: () => ({ meta: [{ title: "BlueRetro Advance config" }] }),
  component: Advance,
});

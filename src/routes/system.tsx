import { createFileRoute } from "@tanstack/react-router";

import { System } from "../pages/System";

export const Route = createFileRoute("/system")({
  head: () => ({ meta: [{ title: "BlueRetro System Manager" }] }),
  component: System,
});

import { createFileRoute } from "@tanstack/react-router";

import { Debug } from "../pages/Debug";

export const Route = createFileRoute("/debug")({
  head: () => ({ meta: [{ title: "BlueRetro Debug" }] }),
  component: Debug,
});

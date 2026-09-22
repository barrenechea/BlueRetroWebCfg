import { createFileRoute } from "@tanstack/react-router";

import { Presets } from "../pages/Presets";

export const Route = createFileRoute("/presets")({
  head: () => ({ meta: [{ title: "BlueRetro Presets config" }] }),
  component: Presets,
});

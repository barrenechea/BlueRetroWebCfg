import { createFileRoute } from "@tanstack/react-router";

import { Ota } from "../pages/Ota";

export const Route = createFileRoute("/ota")({
  head: () => ({ meta: [{ title: "BlueRetro OTA FW update" }] }),
  component: Ota,
});

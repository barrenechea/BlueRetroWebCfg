import { createFileRoute } from "@tanstack/react-router";

import { N64CtrlPak } from "../pages/N64CtrlPak";

export const Route = createFileRoute("/n64_ctrlpak")({
  head: () => ({ meta: [{ title: "BlueRetro N64 controller pak manager" }] }),
  component: N64CtrlPak,
});

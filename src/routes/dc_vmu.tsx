import { createFileRoute } from "@tanstack/react-router";

import { DcVmu } from "../pages/DcVmu";

export const Route = createFileRoute("/dc_vmu")({
  head: () => ({ meta: [{ title: "BlueRetro DC VMU manager" }] }),
  component: DcVmu,
});

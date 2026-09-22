import { createFileRoute } from "@tanstack/react-router";

import { Files } from "../pages/Files";

export const Route = createFileRoute("/files")({
  head: () => ({ meta: [{ title: "BlueRetro Files Manager" }] }),
  component: Files,
});

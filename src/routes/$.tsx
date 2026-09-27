import { createFileRoute } from "@tanstack/react-router";

import { NotFound } from "../pages/NotFound";

// Not the root notFoundComponent: the 404.html shell only hydrates cleanly
// when the path matches a route.
export const Route = createFileRoute("/$")({
  head: () => ({ meta: [{ title: "BlueRetro Page not found" }] }),
  component: NotFound,
});

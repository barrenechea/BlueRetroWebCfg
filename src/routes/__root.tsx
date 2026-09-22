import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import type { ReactNode } from "react";

import indexCss from "../index.css?url";
import { ChromeSamples } from "../lib/logger";

const TABS = [
  { to: "/advance", label: "Advance" },
  { to: "/presets", label: "Presets" },
  { to: "/system", label: "System" },
  { to: "/ota", label: "OTA" },
  { to: "/files", label: "Files" },
  { to: "/n64_ctrlpak", label: "N64 Pak" },
  { to: "/dc_vmu", label: "DC VMU" },
  { to: "/debug", label: "Debug" },
];

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "BlueRetro Web config" },
    ],
    links: [
      { rel: "icon", href: "/icon.png" },
      { rel: "stylesheet", href: indexCss },
    ],
  }),
  shellComponent: RootDocument,
  component: RootShell,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootShell() {
  return (
    <>
      <nav className="tabs">
        {TABS.map((tab) => (
          <Link
            key={tab.to}
            to={tab.to}
            className="tab"
            activeProps={{ className: "active" }}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
      <Outlet />
    </>
  );
}

// Global error listener: make sure browsers which don't support specific
// functionality still end up displaying a meaningful message.
if (typeof window !== "undefined") {
  window.addEventListener("error", function (error) {
    if (ChromeSamples && ChromeSamples.setStatus) {
      console.error(error);
      ChromeSamples.setStatus(
        error.message + " (Your browser may not support this feature.)",
      );
      error.preventDefault();
    }
  });
}

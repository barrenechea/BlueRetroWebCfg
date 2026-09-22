import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import type { ReactNode } from "react";

import {
  BlueRetroProvider,
  useBlueRetro,
} from "../components/BlueRetroContext";
import { ConnectButton } from "../components/ConnectButton";
import { DivInfo } from "../components/DivInfo";
import { OutputPanel } from "../components/OutputPanel";
import { ThemeToggle } from "../components/ThemeToggle";
import indexCss from "../index.css?url";
import { ChromeSamples } from "../lib/logger";

// Runs before hydration so the correct theme class is present on first paint.
const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('blueretro:theme');var parsed=stored?JSON.parse(stored):'auto';var mode=(parsed==='light'||parsed==='dark'||parsed==='auto')?parsed:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');if(resolved==='dark'){root.classList.add('dark');}else{root.classList.add('light');}root.style.colorScheme=resolved;}catch(e){}})();`;

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
  component: RootComponent,
});

function RootDocument({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <TanStackDevtools
          config={{ position: "bottom-right" }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
          ]}
        />
        <Scripts />
      </body>
    </html>
  );
}

// Focus refetches are off: they would hammer the GATT link.
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      gcTime: Infinity,
      staleTime: 0,
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function RootComponent() {
  return (
    <QueryClientProvider client={queryClient}>
      <BlueRetroProvider>
        <RootShell />
      </BlueRetroProvider>
    </QueryClientProvider>
  );
}

function RootShell() {
  const { info, gamename, gameid, connected, connecting, connect, disconnect } =
    useBlueRetro();

  return (
    <>
      <img className="pageIcon" src="/icon.png" alt="" />
      <h1>BlueRetro Web config</h1>
      <p className="availability">
        <a href="/">Index</a> |{" "}
        <a target="_blank" href="https://github.com/darthcloud/BlueRetro">
          View on GitHub
        </a>{" "}
        | <ThemeToggle />
      </p>
      <ConnectButton
        connected={connected}
        connecting={connecting}
        hint="Disconnect all controllers from BlueRetro before connecting."
        onConnect={() => void connect()}
        onDisconnect={disconnect}
      />
      {info && <DivInfo {...info} game={gamename} gameid={gameid} />}
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
      <OutputPanel />
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

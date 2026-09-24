import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Link,
  Outlet,
  ScriptOnce,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { BookOpenIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

import {
  BlueRetroProvider,
  useBlueRetro,
} from "../components/BlueRetroContext";
import { ConnectionPanel } from "../components/ConnectionPanel";
import { OutputPanel } from "../components/OutputPanel";
import { ThemeToggle } from "../components/ThemeToggle";
import indexCss from "../index.css?url";
import { links } from "../lib/docs";
import { ChromeSamples } from "../lib/logger";

// Runs before hydration so the correct theme class is present on first paint.
const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('blueretro:theme');var parsed=stored?JSON.parse(stored):'auto';var mode=(parsed==='light'||parsed==='dark'||parsed==='auto')?parsed:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');if(resolved==='dark'){root.classList.add('dark');}else{root.classList.add('light');}root.style.colorScheme=resolved;}catch(e){}})();`;

const TABS = [
  { to: "/", label: "Home" },
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
        <ScriptOnce>{THEME_INIT_SCRIPT}</ScriptOnce>
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
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />

      <main className="mx-auto w-full max-w-6xl flex-1 space-y-6 px-4 py-6 sm:px-6">
        <ConnectionPanel
          connected={connected}
          connecting={connecting}
          info={info}
          gameid={gameid}
          gamename={gamename}
          onConnect={() => void connect()}
          onDisconnect={disconnect}
        />

        <Outlet />
        <OutputPanel />
      </main>
    </div>
  );
}

function IconLink({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      title={label}
      aria-label={label}
      nativeButton={false}
      render={<a href={href} target="_blank" rel="noreferrer" />}
    >
      {children}
    </Button>
  );
}

function SiteHeader() {
  return (
    <header className="bg-background/85 sticky top-0 z-30 border-b backdrop-blur-sm">
      <div className="mx-auto flex w-full max-w-6xl flex-wrap items-center gap-x-4 gap-y-2 px-4 py-2.5 sm:px-6 lg:h-14 lg:flex-nowrap lg:py-0">
        <div className="order-1 flex min-w-0 items-center gap-3">
          <img src="/icon.png" alt="" className="size-7 shrink-0" />
          <div className="min-w-0 leading-tight">
            <p className="truncate text-sm font-semibold tracking-tight">
              BlueRetro
            </p>
            <p className="text-muted-foreground truncate text-xs">Web config</p>
          </div>
        </div>

        <nav
          aria-label="Configuration pages"
          className="order-3 -mx-1 flex w-full gap-0.5 overflow-x-auto lg:order-2 lg:mx-auto lg:w-auto"
        >
          {TABS.map((tab) => (
            <Button
              key={tab.to}
              variant="ghost"
              size="sm"
              nativeButton={false}
              className="text-muted-foreground data-[status=active]:bg-muted data-[status=active]:text-foreground"
              render={
                <Link to={tab.to} activeOptions={{ exact: tab.to === "/" }} />
              }
            >
              {tab.label}
            </Button>
          ))}
        </nav>

        <div className="order-2 ml-auto flex items-center gap-1 lg:order-3 lg:ml-0">
          <IconLink href={links.wiki} label="Wiki">
            <BookOpenIcon />
          </IconLink>
          <IconLink href={links.repo} label="View on GitHub">
            <svg viewBox="0 0 16 16" fill="currentColor">
              <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38l-.01-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
            </svg>
          </IconLink>
          <ThemeToggle />
        </div>
      </div>
    </header>
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

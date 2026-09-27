import { TanStackDevtools } from "@tanstack/react-devtools";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  HeadContent,
  Outlet,
  ScriptOnce,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { cn } from "cn";
import { BookOpenIcon, TerminalIcon } from "lucide-react";
import { type ReactNode, useState } from "react";

import {
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { TooltipProvider } from "@/components/ui/tooltip";

import { AppSidebar } from "../components/AppSidebar";
import {
  BlueRetroProvider,
  useBlueRetro,
} from "../components/BlueRetroContext";
import { ConnectionPanel } from "../components/ConnectionPanel";
import { ConsolePanel } from "../components/ConsolePanel";
import { ThemeToggle } from "../components/ThemeToggle";
import indexCss from "../index.css?url";
import { links } from "../lib/docs";
import { ChromeSamples, useLog } from "../lib/logger";
import { useLocalStorage } from "../lib/useLocalStorage";

// Runs before hydration so the correct theme class is present on first paint.
const THEME_INIT_SCRIPT = `(function(){try{var stored=window.localStorage.getItem('blueretro:theme');var parsed=stored?JSON.parse(stored):'auto';var mode=(parsed==='light'||parsed==='dark'||parsed==='auto')?parsed:'auto';var prefersDark=window.matchMedia('(prefers-color-scheme: dark)').matches;var resolved=mode==='auto'?(prefersDark?'dark':'light'):mode;var root=document.documentElement;root.classList.remove('light','dark');if(resolved==='dark'){root.classList.add('dark');}else{root.classList.add('light');}root.style.colorScheme=resolved;}catch(e){}})();`;

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
        <TooltipProvider delay={100}>
          <RootShell />
        </TooltipProvider>
      </BlueRetroProvider>
    </QueryClientProvider>
  );
}

function RootShell() {
  const { info, gamename, gameid, connected, connecting, connect, disconnect } =
    useBlueRetro();

  const [consoleOpen, setConsoleOpen] = useLocalStorage(
    "blueretro:console-open",
    false,
  );
  const unread = useUnreadLog(consoleOpen);

  return (
    <SidebarProvider>
      <AppSidebar
        secondary={
          <SidebarActions
            consoleOpen={consoleOpen}
            unread={unread}
            onToggleConsole={() => setConsoleOpen((open) => !open)}
          />
        }
      />
      <SidebarInset className="min-w-0">
        <MobileHeader />

        <div className="flex flex-1">
          <div
            className={cn(
              "mx-auto w-full max-w-6xl min-w-0 flex-1 space-y-6 px-4 py-6 sm:px-6",
              // Keep the end of the page reachable above the bottom sheet.
              consoleOpen && "pb-[calc(45dvh+1.5rem)] lg:pb-6",
            )}
          >
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
          </div>

          {consoleOpen && (
            <ConsolePanel
              onClose={() => setConsoleOpen(false)}
              className="animate-in fade-in-0 slide-in-from-bottom-4 lg:slide-in-from-right-4 fixed inset-x-0 bottom-0 z-20 h-[45dvh] border-t shadow-lg duration-200 lg:sticky lg:top-0 lg:bottom-auto lg:z-auto lg:h-dvh lg:w-md lg:shrink-0 lg:border-t-0 lg:border-l lg:shadow-none"
            />
          )}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}

type Unread = "none" | "info" | "error";

// What the console has logged since it was last open.
function useUnreadLog(open: boolean): Unread {
  const { lines, status } = useLog();
  const lastId = lines.at(-1)?.id ?? -1;
  const [seenId, setSeenId] = useState(-1);

  if (open && seenId != lastId) setSeenId(lastId);

  if (open) return "none";
  const unseen = lines.filter((line) => line.id > seenId);
  if (status || unseen.some((line) => line.error)) return "error";
  return unseen.length > 0 ? "info" : "none";
}

function ConsoleMenuItem({
  open,
  unread,
  onToggle,
}: {
  open: boolean;
  unread: Unread;
  onToggle: () => void;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip="Console"
        isActive={open}
        aria-pressed={open}
        onClick={onToggle}
      >
        <span className="relative flex">
          <TerminalIcon />
          {unread != "none" && (
            <span
              className={cn(
                "ring-sidebar absolute -top-0.5 -right-0.5 size-2 rounded-full ring-2",
                unread == "error" ? "bg-destructive" : "bg-primary",
              )}
            />
          )}
        </span>
        <span>Console</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

function LinkMenuItem({
  href,
  label,
  children,
}: {
  href: string;
  label: string;
  children: ReactNode;
}) {
  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        tooltip={label}
        render={<a href={href} target="_blank" rel="noreferrer" />}
      >
        {children}
        <span>{label}</span>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}

// The sidebar is a drawer below md, so it needs its own trigger.
function MobileHeader() {
  return (
    <header className="bg-background/85 sticky top-0 z-30 flex h-12 items-center gap-2 border-b px-3 backdrop-blur-sm md:hidden">
      <SidebarTrigger />
      <img src="/icon.png" alt="" className="size-9 shrink-0" />
      <span className="text-base font-semibold">BlueRetro</span>
    </header>
  );
}

function SidebarActions({
  consoleOpen,
  unread,
  onToggleConsole,
}: {
  consoleOpen: boolean;
  unread: Unread;
  onToggleConsole: () => void;
}) {
  return (
    <SidebarMenu>
      <LinkMenuItem href={links.wiki} label="Wiki">
        <BookOpenIcon />
      </LinkMenuItem>
      <LinkMenuItem href={links.repo} label="GitHub">
        <svg viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38l-.01-1.49c-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.4 7.4 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48l-.01 2.2c0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
        </svg>
      </LinkMenuItem>
      <SidebarMenuItem>
        <ThemeToggle />
      </SidebarMenuItem>
      <ConsoleMenuItem
        open={consoleOpen}
        unread={unread}
        onToggle={onToggleConsole}
      />
    </SidebarMenu>
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

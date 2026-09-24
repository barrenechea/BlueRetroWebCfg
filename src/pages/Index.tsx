import { Link } from "@tanstack/react-router";
import { ChevronRightIcon } from "lucide-react";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemTitle,
} from "@/components/ui/item";

import { DocLink } from "../components/DocLink";
import { docs } from "../lib/docs";

const PAGES = [
  {
    to: "/advance",
    title: "Advance Config",
    body: "Global settings, output config and the full button mapping table.",
  },
  {
    to: "/presets",
    title: "Presets",
    body: "Load a ready made mapping for a system or a specific game.",
  },
  {
    to: "/system",
    title: "System Manager",
    body: "Deep sleep, reset and factory reset.",
  },
  {
    to: "/ota",
    title: "OTA FW Update",
    body: "Flash a new firmware over Bluetooth.",
  },
  {
    to: "/files",
    title: "Files Manager",
    body: "List and delete the configs stored on the adapter.",
  },
  {
    to: "/n64_ctrlpak",
    title: "N64 Controller Pak Manager",
    body: "Read, write and format the four emulated controller paks.",
  },
  {
    to: "/dc_vmu",
    title: "DC VMU Manager",
    body: "Read and write the emulated VMU.",
  },
  {
    to: "/debug",
    title: "Debug Trace",
    body: "Download a trace to attach to a bug report.",
  },
];

export function Index() {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-heading text-xl font-semibold tracking-tight">
            BlueRetro Web config
          </h1>
          <p className="text-muted-foreground mt-1 max-w-prose text-sm">
            Configure BlueRetro from your browser over Bluetooth, no app to
            install. Connect the adapter above, then pick a page. Please consult
            the documentation found on the wiki.
          </p>
        </div>
        <DocLink href={docs.manual.href}>{docs.manual.label}</DocLink>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {PAGES.map((page) => (
          <Item key={page.to} variant="outline" render={<Link to={page.to} />}>
            <ItemContent>
              <ItemTitle>{page.title}</ItemTitle>
              <ItemDescription>{page.body}</ItemDescription>
            </ItemContent>
            <ItemActions>
              <ChevronRightIcon className="size-4" />
            </ItemActions>
          </Item>
        ))}
      </div>
    </div>
  );
}

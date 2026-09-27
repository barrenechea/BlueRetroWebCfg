import { Link, useMatchRoute } from "@tanstack/react-router";
import {
  BugIcon,
  DownloadIcon,
  FolderIcon,
  HouseIcon,
  ListIcon,
  MemoryStickIcon,
  SaveIcon,
  SettingsIcon,
  SlidersHorizontalIcon,
  type LucideIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

// Grouped like the BlueRetroWebCfg_Beta navigation.
const NAV: { label?: string; items: NavItem[] }[] = [
  { items: [{ to: "/", label: "Home", icon: HouseIcon }] },
  {
    label: "Controller",
    items: [
      { to: "/advance", label: "Advance config", icon: SlidersHorizontalIcon },
      { to: "/presets", label: "Presets", icon: ListIcon },
    ],
  },
  {
    label: "Memory cards",
    items: [
      { to: "/n64_ctrlpak", label: "N64 Controller Pak", icon: SaveIcon },
      { to: "/dc_vmu", label: "DC VMU", icon: MemoryStickIcon },
    ],
  },
  {
    label: "System",
    items: [
      { to: "/files", label: "Files", icon: FolderIcon },
      { to: "/system", label: "Manage", icon: SettingsIcon },
      { to: "/ota", label: "Update", icon: DownloadIcon },
      { to: "/debug", label: "Debug", icon: BugIcon },
    ],
  },
];

export function AppSidebar({
  secondary,
  ...props
}: ComponentProps<typeof Sidebar> & { secondary?: ReactNode }) {
  const matchRoute = useMatchRoute();
  const { setOpenMobile } = useSidebar();

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader className="flex-row items-center group-data-[collapsible=icon]:flex-col">
        <SidebarMenu className="flex-1">
          <SidebarMenuItem>
            <SidebarMenuButton
              size="lg"
              tooltip="BlueRetro"
              onClick={() => setOpenMobile(false)}
              render={<Link to="/" />}
            >
              <img
                src="/icon.png"
                alt=""
                className="size-9 shrink-0 group-data-[collapsible=icon]:size-8"
              />
              <span className="text-base font-semibold">BlueRetro</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarTrigger />
      </SidebarHeader>

      <SidebarContent>
        {NAV.map((group, index) => (
          <SidebarGroup key={group.label ?? index}>
            {group.label && (
              <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            )}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton
                      isActive={!!matchRoute({ to: item.to })}
                      tooltip={item.label}
                      onClick={() => setOpenMobile(false)}
                      render={<Link to={item.to} />}
                    >
                      <item.icon />
                      <span>{item.label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
        {secondary && (
          <SidebarGroup className="mt-auto">
            <SidebarGroupContent>{secondary}</SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}

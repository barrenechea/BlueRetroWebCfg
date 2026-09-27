import { MoonIcon, SunIcon, SunMoonIcon } from "lucide-react";

import { SidebarMenuButton } from "@/components/ui/sidebar";

import { useTheme } from "../lib/useTheme";

const ICONS = { light: SunIcon, dark: MoonIcon, auto: SunMoonIcon } as const;

const LABELS = { light: "Light", dark: "Dark", auto: "System" } as const;

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const Icon = ICONS[theme];
  const label = `Theme: ${LABELS[theme]}`;

  return (
    <SidebarMenuButton
      tooltip={label}
      onClick={cycleTheme}
      aria-label={`${label}. Click to change.`}
    >
      <Icon />
      <span>{label}</span>
    </SidebarMenuButton>
  );
}

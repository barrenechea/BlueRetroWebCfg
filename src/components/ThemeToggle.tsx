import { MoonIcon, SunIcon, SunMoonIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

import { useTheme } from "../lib/useTheme";

const ICONS = { light: SunIcon, dark: MoonIcon, auto: SunMoonIcon } as const;

const LABELS = { light: "Light", dark: "Dark", auto: "System" } as const;

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const Icon = ICONS[theme];

  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={cycleTheme}
      title={`Theme: ${LABELS[theme]}`}
      aria-label={`Theme: ${LABELS[theme]}. Click to change.`}
    >
      <Icon />
    </Button>
  );
}

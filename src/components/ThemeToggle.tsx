import { useTheme } from "../lib/useTheme";

const THEME_CONFIG = {
  dark: { icon: "☾", label: "Dark" },
  light: { icon: "☼", label: "Light" },
  auto: { icon: "⚙", label: "Auto" },
} as const;

export function ThemeToggle() {
  const { theme, cycleTheme } = useTheme();
  const { icon, label } = THEME_CONFIG[theme];

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={cycleTheme}
      aria-label="Toggle color theme"
    >
      <span className="theme-toggle-icon">{icon}</span>
      <span>{label}</span>
    </button>
  );
}

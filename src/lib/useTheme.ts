import { useLocalStorage } from "./useLocalStorage";

type Theme = "dark" | "light" | "auto";

const THEME_KEY = "blueretro:theme";
const THEMES: Theme[] = ["dark", "light", "auto"];

export function useTheme() {
  const [theme, setTheme] = useLocalStorage<Theme>(THEME_KEY, "auto");

  const cycleTheme = () => {
    const nextTheme = THEMES[(THEMES.indexOf(theme) + 1) % THEMES.length];
    setTheme(nextTheme);

    const resolvedTheme =
      nextTheme === "auto"
        ? window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light"
        : nextTheme;

    const root = document.documentElement;
    root.classList.toggle("dark", resolvedTheme === "dark");
    root.classList.toggle("light", resolvedTheme !== "dark");
    root.style.colorScheme = resolvedTheme;
  };

  return { theme, cycleTheme };
}

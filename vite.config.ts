import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [
    tanstackStart({
      prerender: { enabled: true },
      router: { quoteStyle: "double", semicolons: true },
    }),
    react({ compiler: true }),
  ],
});

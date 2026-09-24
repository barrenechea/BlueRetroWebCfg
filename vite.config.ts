import tailwindcss from "@tailwindcss/vite";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import basicSsl from "@vitejs/plugin-basic-ssl";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart({
      prerender: { enabled: true },
      router: { quoteStyle: "double", semicolons: true },
    }),
    react({ compiler: true }),
    // HTTPS so Web Bluetooth works off localhost. Prerendering re-evaluates
    // this config to boot a preview server it then crawls with fetch(), which
    // would reject the self-signed cert.
    !process.env.TSS_PRERENDERING && basicSsl(),
  ],
});

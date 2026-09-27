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
      // advance.html, not advance/index.html: Cloudflare Pages redirects
      // /advance to /advance/ for the latter.
      prerender: { enabled: true, autoSubfolderIndex: false },
      pages: [
        // App shell as 404.html, which Cloudflare Pages serves for unknown
        // paths. Not the `spa` option: it also makes the dev server shell only.
        {
          // Not "/": pages are deduped by path, so the index would be skipped.
          path: "/?shell",
          prerender: {
            outputPath: "/404",
            crawlLinks: false,
            headers: { "X-TSS_SHELL": "true" },
          },
        },
      ],
      router: { quoteStyle: "double", semicolons: true },
    }),
    react({ compiler: true }),
    // HTTPS so Web Bluetooth works off localhost. Prerendering re-evaluates
    // this config to boot a preview server it then crawls with fetch(), which
    // would reject the self-signed cert.
    !process.env.TSS_PRERENDERING && basicSsl(),
  ],
});

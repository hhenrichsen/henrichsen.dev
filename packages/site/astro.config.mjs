// @ts-check
import { defineConfig } from "astro/config";
import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import astroExpressiveCode from "astro-expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import sitemap from "@astrojs/sitemap";

// https://astro.build/config
export default defineConfig({
  adapter: cloudflare(),
  site: "https://henrichsen.dev",
  integrations: [
    astroExpressiveCode({
      themes: ["catppuccin-mocha", "catppuccin-latte"],
      plugins: [pluginLineNumbers(), pluginCollapsibleSections()],
      styleOverrides: {
        codeFontFamily: "Ellograph CF, monospace",
      },
      defaultProps: {
        showLineNumbers: true,
        overridesByLang: {
          "console,bash": {
            showLineNumbers: false,
          },
        },
      },
    }),
    mdx(),
    sitemap(),
  ],
});

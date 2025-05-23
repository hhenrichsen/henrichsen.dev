// @ts-check
import { defineConfig } from "astro/config";
import mdx from "@astrojs/mdx";
import astroExpressiveCode from "astro-expressive-code";
import { pluginLineNumbers } from "@expressive-code/plugin-line-numbers";
import { pluginCollapsibleSections } from "@expressive-code/plugin-collapsible-sections";
import sitemap from "@astrojs/sitemap";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import pagefind from "astro-pagefind";

// https://astro.build/config
export default defineConfig({
  site: "https://henrichsen.dev",
  build: {
    format: "file",
  },
  markdown: {
    rehypePlugins: [
      rehypeSlug,
      [
        rehypeAutolinkHeadings,
        {
          behavior: "append",
          content: {
            type: "text",
            value: "#",
          },
          properties: {
            className: "heading-anchor",
          },
        },
      ],
    ],
  },
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
    pagefind(),
  ],
});

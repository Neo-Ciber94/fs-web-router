import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://Neo-Ciber94.github.io",
  base: "keiro",
  integrations: [
    starlight({
      title: "keiro",
      social: {
        github: "https://github.com/Neo-Ciber94/keiro",
      },
      components: {},
      favicon: "./keiro/favicon.ico",
      customCss: ["./src/styles/tailwind.css"],
      sidebar: [
        {
          label: "Guides",
          items: [
            {
              label: "Getting Started",
              link: "/keiro/guides/getting-started/",
            },
            {
              label: "Routing",
              link: "/keiro/guides/routing/",
            },
            {
              label: "API Handler",
              link: "/keiro/guides/api-handler/",
            },
            {
              label: "Middleware",
              link: "/keiro/guides/middleware/",
            },
            {
              label: "Not Found",
              link: "/keiro/guides/not-found/",
            },
            {
              label: "API Reference",
              link: "/keiro/guides/api-reference/",
            },
          ],
        },
        {
          label: "Reference",
          autogenerate: {
            directory: "reference",
          },
        },
      ],
    }),
    tailwind(),
    react(),
  ],
});

import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  site: "https://Neo-Ciber94.github.io",
  integrations: [
    starlight({
      title: "keiro",
      social: {
        github: "https://github.com/Neo-Ciber94/keiro",
      },
      components: {},
      favicon: "./favicon.ico",
      customCss: ["./src/styles/tailwind.css"],
      sidebar: [
        {
          label: "Guides",
          items: [
            {
              label: "Getting Started",
              link: "/guides/getting-started/",
            },
            {
              label: "Routing",
              link: "/guides/routing/",
            },
            {
              label: "API Handler",
              link: "/guides/api-handler/",
            },
            {
              label: "Middleware",
              link: "/guides/middleware/",
            },
            {
              label: "Not Found",
              link: "/guides/not-found/",
            },
            {
              label: "API Reference",
              link: "/guides/api-reference/",
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

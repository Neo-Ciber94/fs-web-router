import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import react from "@astrojs/react";

import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: "keiro",
      social: {
        github: "https://github.com/Neo-Ciber94/keiro",
      },
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

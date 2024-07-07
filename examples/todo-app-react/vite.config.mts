import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsConfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsConfigPaths()],
  define: {
    "import.meta.env.VITE_API_URL": JSON.stringify("http://localhost:5000"),
  },
  build: {
    outDir: "build/client",
  },
});

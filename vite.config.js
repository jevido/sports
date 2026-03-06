import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [sveltekit()],
});

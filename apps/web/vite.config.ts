import { sveltekit } from "@sveltejs/kit/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [sveltekit()],
  server: {
    // Mirrors the Caddy /api/* reverse proxy in production so the frontend
    // can call the relative "/api" base URL in every environment.
    proxy: {
      "/api": "http://localhost:3000",
    },
  },
});

import adapter from "@sveltejs/adapter-static";
import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    // Pure CSR/SPA output — every route resolves to index.html client-side.
    adapter: adapter({
      fallback: "index.html",
      pages: "build",
      assets: "build",
      strict: true,
    }),
  },
};

export default config;

import { defineConfig } from "vite";

export default defineConfig({
  build: {
    // `public` also contains the other games, so a Runner build must never empty it.
    emptyOutDir: false,
    rollupOptions: {
      output: {
        // Stable names prevent orphaned hashed bundles from accumulating in public.
        entryFileNames: "runner-assets/runner.js",
        chunkFileNames: "runner-assets/[name].js",
        assetFileNames: "runner-assets/[name][extname]",
      },
    },
  },
});

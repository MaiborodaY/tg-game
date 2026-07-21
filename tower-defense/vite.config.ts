import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "../public/td",
    emptyOutDir: true,
    target: "es2020",
    rollupOptions: {
      output: {
        entryFileNames: "assets/game.js",
        chunkFileNames: "assets/[name].js",
        assetFileNames: "assets/[name][extname]",
      },
    },
  },
});

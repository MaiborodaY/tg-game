import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "../workers/bridge-pvp/dist/client",
    emptyOutDir: true,
    target: "es2020",
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
  },
});

import { defineConfig } from "vite";

export default defineConfig({
  base: "./",
  build: {
    outDir: "../public/td",
    emptyOutDir: true,
    target: "es2020",
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
      },
    },
    rolldownOptions: {
      output: {
        codeSplitting: {
          groups: [
            {
              name: "phaser",
              test: /[\\/]node_modules[\\/]phaser[\\/]/,
            },
          ],
        },
      },
    },
  },
});

import { defineConfig } from "vite";

import {
  readTowerDefenseBuildInfo,
  TOWER_DEFENSE_BUILD_PLACEHOLDER,
} from "./scripts/app-version.mjs";

export default defineConfig({
  base: "./",
  plugins: [
    {
      name: "tower-defense-app-version",
      transformIndexHtml(html) {
        const placeholders = html.split(TOWER_DEFENSE_BUILD_PLACEHOLDER).length - 1;
        if (placeholders !== 2) {
          throw new Error(`Expected two Tower Defense app version placeholders, found ${placeholders}`);
        }
        const appBuild = readTowerDefenseBuildInfo();
        return html.replaceAll(TOWER_DEFENSE_BUILD_PLACEHOLDER, appBuild.label);
      },
    },
  ],
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

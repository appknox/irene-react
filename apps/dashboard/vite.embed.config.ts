import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { translationsPlugin } from '@irene/translations/vite';
import { svgrPlugin } from '@irene/ui/vite';

/*
  Builds the embed surface for a host application to load.

  React is bundled rather than left external, so the host needs no React of its
  own and the page is guaranteed a single instance of it.

  `__BUILD_CONFIG__` is not frozen here, unlike the application's own build. It
  resolves at runtime from a global the host sets through `mountIrenePage`, so
  an installation that injects its configuration at container start still
  reaches these pages.
*/
const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

/* Where a host serves these files from. Baked in, so the stylesheet finds its own fonts. */
const EMBED_BASE = '/assets/embed/';

export default defineConfig({
  base: EMBED_BASE,
  define: { __BUILD_CONFIG__: '(globalThis.__IRENE_EMBED_CONFIG__ ?? {})' },
  plugins: [
    /*
      Splits each route's component into its own chunk, as the application's
      own build does. Without it the whole route tree is one file, and a host
      page loads every screen's code to render one.

      Must run before the React plugin.
    */
    tanstackRouter({ autoCodeSplitting: true }),

    translationsPlugin(),
    react(),
    tailwindcss(),
    svgrPlugin(),
  ],
  resolve: { alias: { '@': resolvePath('./src') } },

  build: {
    outDir: 'embed-dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    sourcemap: true,

    /*
      Not `build.lib`: that mode inlines every asset a stylesheet references,
      which would put all eighteen font files into the CSS as base64. A plain
      build with an explicit entry emits them as files the host can serve.
    */
    assetsInlineLimit: 0,

    rolldownOptions: {
      input: resolvePath('./src/embed/index.ts'),

      /*
        Without this the entry is treated as an application's, and its exports
        are dropped as unused — the bundle then runs on load and exports
        nothing for a host to call.
      */
      preserveEntrySignatures: 'strict',
      output: {
        format: 'es',
        entryFileNames: 'embed.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: '[name][extname]',
      },
    },
  },
});

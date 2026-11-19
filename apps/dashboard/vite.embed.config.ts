import { cpSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';

import { translationsPlugin } from '@irene/translations/vite';
import { svgrPlugin } from '@irene/ui/vite';

import { scopeEmbedCss } from './src/embed/scripts/scope-embed-css';

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

/** Where the Ember app serves this bundle from, and so where it is staged. */
const STAGED_AT = resolvePath('../irene/public/assets/embed');

/**
 * Finishes the bundle: scopes the stylesheet, then stages it where the host
 * serves it from.
 *
 * Both run here rather than after the build, so `--watch` redoes them on every
 * save and the host picks the change up on a reload.
 *
 * @returns The Vite plugin.
 */
function stageForHost(): Plugin {
  return {
    name: 'stage-embed-for-host',

    closeBundle() {
      const built = resolvePath('./embed-dist');
      const stylesheet = join(built, 'style.css');

      writeFileSync(stylesheet, scopeEmbedCss(readFileSync(stylesheet, 'utf8')), 'utf8');

      /* Cleared first: chunk names carry a hash, so stale ones pile up. */
      rmSync(STAGED_AT, { recursive: true, force: true });
      cpSync(built, STAGED_AT, { recursive: true });
    },
  };
}

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
    stageForHost(),
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

      output: {
        format: 'es',
        entryFileNames: 'embed.js',
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: '[name][extname]',

        /*
          Dependencies in a chunk of their own. They change far less often than
          the screens do, so a host that has loaded one build keeps them when
          the next ships.
        */
        advancedChunks: {
          groups: [{ name: 'vendor', test: /node_modules/ }],
        },
      },
    },
  },
});

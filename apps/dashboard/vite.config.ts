import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { buildConfigDefine } from '@irene/config';
import { translationsPlugin } from '@irene/translations/vite';
import { svgrPlugin } from '@irene/ui/vite';

import { emberProxy } from './vite/ember-proxy';


// Resolve paths to files in the src directory.
const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // Freezes the registered config keys into the bundle. Without it
  // __BUILD_CONFIG__ is undefined at runtime.
  define: buildConfigDefine(),
  plugins: [
    /*
      Generates routeTree.gen.ts from tsr.config.json, which `tsr generate`
      reads too. Must run before the React plugin.
    */
    tanstackRouter({ autoCodeSplitting: true }),

    // Generates the flat message files, and regenerates them when a translation file is saved.
    translationsPlugin(),
    react(),
    tailwindcss(),

    // Turns `@irene/ui/svgs/*.svg?react` imports into components.
    svgrPlugin(),
  ],
  resolve: {
    alias: { '@': resolvePath('./src') },

    // Two copies of React answer hooks from two dispatchers, which fails as an invalid hook call.
    dedupe: ['react', 'react-dom'],
  },

  optimizeDeps: {
    /*
      Vite pre-bundles what the app's own source imports, so a dependency only a
      workspace package reaches is named here. Discovering one mid-session
      reloads the dependency graph under the running page.
    */
    include: ['dayjs', 'dayjs/locale/ja', 'dayjs/plugin/relativeTime', 'dayjs/plugin/utc'],
  },
  server: { port: 4200, strictPort: true, proxy: emberProxy() },
});

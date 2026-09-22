import { fileURLToPath, URL } from 'node:url';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { defineConfig } from 'vitest/config';

import { svgrPlugin } from '@irene/ui/vite';

const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  plugins: [
    /*
      Regenerates routeTree.gen.ts before the run, so a route added without
      starting the dev server is still the tree the tests exercise. Code
      splitting is a dev and build concern, and off here.
    */
    tanstackRouter({ autoCodeSplitting: false, disableLogging: true }),

    svgrPlugin(),
  ],
  define: {
    // The app freezes this into the bundle. Tests vary it per case, so here the
    // identifier has to resolve at runtime instead.
    __BUILD_CONFIG__: 'globalThis.__BUILD_CONFIG__',
  },
  resolve: { alias: { '@': resolvePath('./src'), '@tests': resolvePath('./tests') } },
  test: {
    environment: 'jsdom',

    /*
      One jsdom per worker rather than one per file, which the files were
      spending most of the run creating. The setup file clears the module
      state that then outlives a file: storage, the stores and the handlers.
    */
    isolate: false,
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
});

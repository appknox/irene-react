import { fileURLToPath, URL } from 'node:url';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import { defineConfig } from 'vitest/config';

import { svgrPlugin } from '@irene/ui/vite';

import { coverageConfig } from '../../vitest.coverage.ts';

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
      A jsdom and a module registry per file.

      Sharing them across a worker is faster, and was how this ran, but it
      makes a file's result depend on which files ran before it in the same
      worker: a `vi.mock` only applies if no earlier file imported the real
      module, and the locale a file reads at import time is whatever the last
      one left. Both failed in CI, where the files group differently than they
      do here, and neither is something a test can defend against.
    */
    isolate: true,
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: coverageConfig,
  },
});

import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vitest/config';

import { svgrPlugin } from '@irene/ui/vite';

import { coverageConfig } from '../../vitest.coverage';

/*
  Handed to the tests, since a test that reads a file cannot rely on the
  working directory: a shared environment is entered from the workspace root.
*/
const packageRoot = fileURLToPath(new URL('.', import.meta.url));

export default defineConfig({
  plugins: [svgrPlugin()],
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
    env: { IRENE_UI_PACKAGE_ROOT: packageRoot },
    coverage: coverageConfig,
  },
});

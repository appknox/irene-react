import { defineConfig } from 'vitest/config';
import { coverageConfig } from '../../vitest.coverage.ts';

export default defineConfig({
  define: {
    // The app freezes this into the bundle. Tests set it at runtime instead, so
    // here the identifier has to resolve rather than be replaced.
    __BUILD_CONFIG__: 'globalThis.__BUILD_CONFIG__',
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: coverageConfig,
  },
});

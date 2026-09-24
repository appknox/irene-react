import { defineConfig } from 'vitest/config';
import { coverageConfig } from '../../vitest.coverage';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: coverageConfig,
  },
});

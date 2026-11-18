import { defineConfig } from 'vitest/config';
import { coverageConfig } from '../../vitest.coverage.ts';

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: coverageConfig,
  },
});

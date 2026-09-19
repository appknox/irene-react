import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  define: {
    // The app freezes this into the bundle. Tests vary it per case, so here the
    // identifier has to resolve at runtime instead.
    __BUILD_CONFIG__: 'globalThis.__BUILD_CONFIG__',
  },
  resolve: { alias: { '@tests': resolvePath('./tests') } },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text', 'html'] },
  },
});

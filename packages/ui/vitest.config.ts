import { defineConfig } from 'vitest/config';
import { svgrPlugin } from '@irene/ui/vite';

export default defineConfig({
  plugins: [svgrPlugin()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./tests/setup.ts'],
    coverage: { provider: 'v8', reporter: ['text'] },
  },
});

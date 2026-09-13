import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';

import { buildConfigDefine } from '@irene/config';

// Resolve paths to files in the src directory.
const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // Freezes the registered config keys into the bundle. Without it
  // __BUILD_CONFIG__ is undefined at runtime.
  define: buildConfigDefine(),
  plugins: [
    // Generates routeTree.gen.ts. Must run before the React plugin.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: { alias: { '@': resolvePath('./src') } },
  server: { port: 4200, strictPort: true },
});

import { fileURLToPath, URL } from 'node:url';
import { defineConfig } from 'vite';

import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

import { buildConfigDefine } from '@irene/config/vite';

// Resolve paths to files in the src directory.
const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // Freezes the registered config keys into the bundle. Every app needs
  // this; without it __BUILD_CONFIG__ is undefined.
  define: buildConfigDefine(),
  plugins: [react(), tailwindcss()],
  resolve: { alias: { '@': resolvePath('./src') } },
  server: { port: 4200, strictPort: true },
});

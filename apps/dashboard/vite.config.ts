import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import { tanstackRouter } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

import { buildConfigDefine } from '@irene/config';
import { translationsPlugin } from '@irene/translations/vite';
import { svgrPlugin } from '@irene/ui/vite';

// Resolve paths to files in the src directory.
const resolvePath = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
  // Freezes the registered config keys into the bundle. Without it
  // __BUILD_CONFIG__ is undefined at runtime.
  define: buildConfigDefine(),
  plugins: [
    // Generates routeTree.gen.ts. Must run before the React plugin.
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    // Generates the flat message files, and regenerates them when a translation file is saved.
    translationsPlugin(),
    react(),
    tailwindcss(),
    // Turns `@irene/ui/svgs/*.svg?react` imports into components.
    svgrPlugin(),
  ],
  resolve: { alias: { '@': resolvePath('./src') } },
  server: { port: 4200, strictPort: true },
});

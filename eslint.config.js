import { defineConfig, globalIgnores } from 'eslint/config';
import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores(['**/dist', '**/coverage', '**/.turbo', '**/routeTree.gen.ts']),

  {
    files: ['**/*.{ts,tsx}'],
    extends: [js.configs.recommended, tseslint.configs.recommended],
    languageOptions: {
      ecmaVersion: 2022,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      'padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['block', 'block-like'], next: '*' },
        { blankLine: 'always', prev: '*', next: ['block', 'block-like'] },
      ],
      // `@ui/*` and `@api/*` are path aliases for package internals. An app
      // reaching for them bypasses the exports map and pulls in more than it asked for.
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@ui/*', '@api/*', '@config/*'],
              message:
                'Apps import package subpaths (@irene/ui/...). @ui, @api and @config are for package internals.',
            },
          ],
        },
      ],
    },
  },

  {
    // Package internals are the one place those aliases belong.
    files: ['packages/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
]);

import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import betterTailwind from 'eslint-plugin-better-tailwindcss';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

import maxComponentLines from './eslint/rules/max-component-lines.js';
import noConditionalMessageId from './eslint/rules/no-conditional-message-id.js';

const MULTILINE_STATEMENTS = [
  'multiline-const',
  'multiline-let',
  'multiline-var',
  'multiline-using',
  'multiline-expression',
  'multiline-export',
  'multiline-type',
  'multiline-return',
];

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
      'better-tailwindcss': betterTailwind,
      '@stylistic': stylistic,
    },

    settings: {
      'better-tailwindcss': {
        entryPoint: 'packages/ui/styles/index.css',
      },
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      curly: ['error', 'all'],
      'nonblock-statement-body-position': ['error', 'below'],
      'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
      // Runtime namespaces stay banned; `declare global` augmentations of library types are allowed.
      '@typescript-eslint/no-namespace': ['error', { allowDeclarations: true }],
      '@stylistic/padding-line-between-statements': [
        'error',
        { blankLine: 'always', prev: '*', next: 'return' },
        { blankLine: 'always', prev: ['block', 'block-like'], next: '*' },
        { blankLine: 'always', prev: '*', next: ['block', 'block-like'] },
        // A statement spanning several lines gets a blank line on both sides.
        { blankLine: 'always', prev: MULTILINE_STATEMENTS, next: '*' },
        { blankLine: 'always', prev: '*', next: MULTILINE_STATEMENTS },
      ],
      // `@ui/*` and `@api/*` are path aliases for package internals. An app
      // reaching for them bypasses the exports map and pulls in more than it asked for.
      /*
        Arbitrary values bypass the design system. A colour, radius, shadow or
        spacing written inline is invisible to the token set, so the week the
        palette lands it has to be found by hand rather than changed in one
        file. Add a token instead.
      */
      'better-tailwindcss/no-restricted-classes': [
        'error',
        {
          restrict: [
            /*
              Colours and shadows, off for now. Turn this back on once the
              design team's palette lands — until then components sometimes
              need a value the provisional token set has no name for.

              (^|:) so an arbitrary variant like has-[>svg]: is not mistaken
              for an arbitrary value.
            */
            // {
            //   pattern: String.raw`(^|:)(bg|text|border|ring|outline|divide|fill|stroke|shadow|from|via|to|accent|caret|decoration)-\[`,
            //   message: 'Hardcoded value. Use a token from packages/ui/styles/theme.css.',
            // },
            {
              // (?!var\() lets a class reference a runtime custom property,
              // like the values Radix sets on a popover.
              pattern: String.raw`(^|:)rounded(-(s|e|t|r|b|l|ss|se|ee|es|tl|tr|br|bl))?-\[(?!var\()`,
              message: 'Hardcoded radius. Use rounded-xs through rounded-2xl, or rounded-full.',
            },
            {
              pattern: String.raw`(^|:)(p|px|py|pt|pr|pb|pl|ps|pe|m|mx|my|mt|mr|mb|ml|ms|me|gap|gap-x|gap-y|space-x|space-y|w|h|size|min-w|min-h|max-w|max-h|inset|inset-x|inset-y|top|right|bottom|left)-\[(?!var\()`,
              message:
                'Hardcoded spacing. The scale is driven by --spacing; add a token if none fits.',
            },
            {
              pattern: String.raw`(^|:)(text|leading|tracking|font)-\[(?!var\()`,
              message: 'Hardcoded type value. Use the --text-* and --font-weight-* tokens.',
            },
          ],
        },
      ],

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
    // The rules written for this repo, in eslint/rules.
    files: ['**/*.{ts,tsx}'],
    plugins: {
      irene: {
        rules: {
          'max-component-lines': maxComponentLines,
          'no-conditional-message-id': noConditionalMessageId,
        },
      },
    },

    // A message id chosen by a ternary hides both ids from the reader and the extractor.
    rules: { 'irene/no-conditional-message-id': 'error' },
  },

  {
    // A component past 350 lines of code does too much; the error says how to split it.
    files: ['**/*.tsx'],
    ignores: ['**/*.test.tsx', '**/*.stories.tsx'],
    rules: { 'irene/max-component-lines': ['error', { max: 350 }] },
  },

  {
    // Package internals are the one place those aliases belong.
    files: ['packages/**/*.{ts,tsx}'],
    rules: { 'no-restricted-imports': 'off' },
  },
]);

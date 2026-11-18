import { coverageConfigDefaults, type ViteUserConfig } from 'vitest/config';

type CoverageOptions = NonNullable<NonNullable<ViteUserConfig['test']>['coverage']>;

/** Files with no behaviour of their own, so no test can move their number. */
const UNMEASURED = [
  ...coverageConfigDefaults.exclude,
  '**/routeTree.gen.ts',
  '**/tests/**',

  /* A harness a package ships for other packages' tests, same as `tests/`. */
  '**/src/testing/**',
  '**/*.stories.tsx',
  '**/vite/**',

  /* The router plugin rewrites these, and counts its own unreachable branches
     against them. Guards and loaders are covered through the pages. */
  '**/src/routes/**',

  /* Composition: a test would assert only that the file lists what it lists. */
  '**/src/main.tsx',
  '**/src/App.tsx',

  /* A development-only shim that renders nothing in production. */
  '**/query-devtools.tsx',

  /* Build tooling, which runs on import. Root-scoped, so `src/scripts` counts. */
  'scripts/**',
];

/* A shard measures part of the suite. Thresholds apply to the merged report. */
const MEASURES_ONE_SHARD = process.argv.some((arg) => arg.startsWith('--shard'));

/**
 * The coverage settings every workspace shares.
 *
 * Thresholds fail the run rather than print a number nobody reads, and each
 * sits just under what the least-covered package reaches today.
 */
export const coverageConfig: CoverageOptions = {
  provider: 'v8',
  reporter: ['text', 'html'],

  /* Named, so a module nobody tests reads as uncovered rather than being absent. */
  include: ['src/**/*.{ts,tsx}', 'scripts/**/*.{ts,tsx}'],
  exclude: UNMEASURED,
  thresholds: MEASURES_ONE_SHARD
    ? undefined
    : { statements: 93, branches: 95, functions: 94, lines: 91 },
};

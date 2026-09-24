import { coverageConfigDefaults, type ViteUserConfig } from 'vitest/config';

type CoverageOptions = NonNullable<NonNullable<ViteUserConfig['test']>['coverage']>;

/**
 * Files that carry no behaviour of their own, so measuring them reports a
 * number that no test can move: the generated route tree, the harness the tests
 * are written with, and Storybook stories.
 */
const UNMEASURED = [
  ...coverageConfigDefaults.exclude,
  '**/routeTree.gen.ts',
  '**/tests/**',
  '**/*.stories.tsx',
  '**/vite/**',

  /*
    Route definitions. The router plugin rewrites every one of these files, and
    what it adds is counted against the file: a five-line route with no
    conditional and no function of its own still reports seven branches and two
    functions, most of them unreachable. The guards and loaders they declare are
    covered through the pages that render them.
  */
  '**/src/routes/**',

  /*
    The entry point and the provider tree it renders. Both are composition: a
    test of either asserts that the file lists what it lists, and the pieces are
    covered where they do their work.
  */
  '**/src/main.tsx',
  '**/src/App.tsx',

  /* A development-only shim: its whole job is to render nothing in production. */
  '**/query-devtools.tsx',

  /*
    Build tooling. These scripts run on import — they write generated files and
    rewrite sources — so a test of one is a run of one.
  */
  '**/scripts/**',
];

/**
 * The coverage settings every workspace shares.
 *
 * The thresholds fail the run rather than print a number nobody reads: a change
 * that leaves a branch untested is a failing test, not a report to skim.
 */
export const coverageConfig: CoverageOptions = {
  provider: 'v8',
  reporter: ['text', 'html'],

  /*
    Named rather than left to default. Vitest reports only the files a test
    imported, so a module nobody tests is absent from the table instead of
    sitting at zero, and the total reads higher the less of the app is covered.
  */
  include: ['src/**/*.{ts,tsx}', 'scripts/**/*.{ts,tsx}'],
  exclude: UNMEASURED,
  thresholds: { statements: 90, branches: 90, functions: 90, lines: 90 },
};

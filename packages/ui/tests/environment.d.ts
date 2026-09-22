/**
 * What vitest.config.ts hands the tests through the environment.
 *
 * Declared so a test reads it as a string: a test that resolves a path cannot
 * use the working directory, which a shared environment enters from the
 * workspace root.
 */
declare namespace NodeJS {
  interface ProcessEnv {
    /** Where this package lives on disk. This is set by vitest.config.ts. */
    IRENE_UI_PACKAGE_ROOT: string;
  }
}

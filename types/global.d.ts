/**
 * The global a server writes at container start, before the bundle runs.
 * Declarations only — erased at compile time, so packages/config keeps its
 * no-imports guarantee.
 */
interface Window {
  runtimeGlobalConfig?: Record<string, string>;
}

/**
 * The build-time config, as the vitest configs expose it. Vite replaces
 * `__BUILD_CONFIG__` with a literal when it bundles, so no such global exists
 * in a built app — only a test may read or assign this.
 */
// eslint-disable-next-line no-var
declare var __BUILD_CONFIG__: Record<string, string>;

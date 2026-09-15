/**
 * The global a server writes at container start, before the bundle runs.
 * Declarations only — erased at compile time, so packages/config keeps its
 * no-imports guarantee.
 */
interface Window {
  runtimeGlobalConfig?: Record<string, string>;
}

import { afterEach, beforeEach } from 'vitest';

declare global {
  var __BUILD_CONFIG__: Record<string, string>;
}

/**
 * Both config tiers are globals, so a value left behind by one test would leak
 * into the next. Clear them around every case.
 */
const reset = () => {
  globalThis.__BUILD_CONFIG__ = {};
  delete window.runtimeGlobalConfig;
};

beforeEach(reset);
afterEach(reset);

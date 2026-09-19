import { afterEach, beforeEach } from 'vitest';

/**
 * Both config tiers are globals, so a value left behind by one test would leak
 * into the next. Clear them around every case.
 */
const reset = () => {
  globalThis.__BUILD_CONFIG__ = {};
  delete window.runtimeGlobalConfig;
};

// Modules read config at import, so the tiers must exist before they load.
reset();

beforeEach(reset);
afterEach(reset);

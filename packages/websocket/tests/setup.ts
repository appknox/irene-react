import { beforeEach } from 'vitest';

/**
 * The build config is a global the API layer reads as it loads, so it has to
 * exist before a module under test imports it, and be cleared between cases.
 */
const reset = () => {
  globalThis.__BUILD_CONFIG__ = {};
};

reset();

beforeEach(reset);

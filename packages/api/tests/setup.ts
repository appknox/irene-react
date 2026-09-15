import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { server } from '@tests/server';

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

// Modules read config at import, so the tiers must exist before they load.
reset();

beforeEach(reset);
afterEach(reset);

beforeAll(() => {
  // An unhandled request means a test is hitting an endpoint it did not declare.
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  server.resetHandlers();
});

afterAll(() => {
  server.close();
});

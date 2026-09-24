import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';
import { server } from '@tests/server';

/**
 * Both config tiers are globals, so a value left behind by one test would leak
 * into the next. Clear them around every case.
 */
const reset = () => {
  globalThis.__BUILD_CONFIG__ = {};
  delete window.runtimeGlobalConfig;
};

/*
  jsdom implements no navigation, so the redirect the interceptor performs is
  reported as an unimplemented feature. The cases that assert on it replace
  `location` with their own recorder.
*/
Object.defineProperty(window, 'location', {
  value: { ...window.location, replace: () => undefined },
  configurable: true,
});

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

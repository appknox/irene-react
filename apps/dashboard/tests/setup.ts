import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { configurationStore } from '@irene/api/stores/configuration';
import { akNotify } from '@irene/ui/notify';

import { server } from '@tests/server';

/*
  jsdom has no layout, so it implements no scrolling. The router calls scrollTo
  on every navigation, which jsdom reports as an unimplemented method on stderr.
  A no-op keeps that noise out of the run.
*/
window.scrollTo = () => undefined;

/**
 * Both config tiers are globals, a stored session outlives the DOM, and the
 * configuration store settles once per tab, so anything one test leaves behind
 * would reach the next. Clear them around every case.
 */
const reset = () => {
  globalThis.__BUILD_CONFIG__ = {};
  delete window.runtimeGlobalConfig;
  window.localStorage.clear();

  // Replaces rather than merges, so the store goes back to unsettled with its actions intact.
  configurationStore.setState(configurationStore.getInitialState(), true);
};

// Modules read config at import, so the tiers must exist before they load.
reset();

beforeEach(reset);

beforeAll(() => {
  // An unhandled request means a test is hitting an endpoint it did not declare.
  server.listen({ onUnhandledRequest: 'error' });
});

afterEach(() => {
  cleanup();
  reset();
  server.resetHandlers();

  // Toasts live in a module-level store that outlives the DOM, so one raised
  // here would still be on screen for the next test.
  akNotify.dismiss();
});

afterAll(() => {
  server.close();
});

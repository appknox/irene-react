import '@testing-library/jest-dom/vitest';

import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, beforeEach } from 'vitest';

import { queryClient } from '@irene/api/query-client';
import { configurationStore } from '@irene/api/stores/configuration';
import { akNotify } from '@irene/ui/notify';

import { server } from '@tests/server';

/*
  jsdom has no layout, so it implements no scrolling. The router calls scrollTo
  on every navigation, which jsdom reports as an unimplemented method on stderr.
  A no-op keeps that noise out of the run.
*/
window.scrollTo = () => undefined;

/*
  The router warns for every route it catches an error in, which several tests
  cause on purpose. Its own message is dropped; anything else still surfaces.
*/
const ROUTER_ERROR_WARNING = 'Warning: Error in route match';
const warn = console.warn.bind(console);

console.warn = (...args: unknown[]) => {
  if (typeof args[0] === 'string' && args[0].startsWith(ROUTER_ERROR_WARNING)) {
    return;
  }

  warn(...args);
};

/*
  jsdom implements no layout and no pointer capture, both of which Radix uses to
  position and drive its popovers. Without these a Select never opens and the
  failure looks like a component bug rather than a missing browser API.
*/
Element.prototype.hasPointerCapture ??= () => false;

Element.prototype.setPointerCapture ??= () => {};

Element.prototype.releasePointerCapture ??= () => {};

Element.prototype.scrollIntoView ??= () => {};

/*
  jsdom implements no layout, so it has no ResizeObserver either. Radix measures
  with one wherever a control can change size, and throws without it.
*/
globalThis.ResizeObserver ??= class {
  observe() {} // NOSONAR
  unobserve() {} // NOSONAR
  disconnect() {} // NOSONAR
};

/*
  React Tanstack Query retries keep their real behaviour, but wait no time between attempts. A 500 is
  retried twice, and the backoff between those attempts is seconds of a test run
  spent asleep.
*/
const defaults = queryClient.getDefaultOptions();
queryClient.setDefaultOptions({ ...defaults, queries: { ...defaults.queries, retryDelay: 0 } });

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

  // The cache is a module singleton, so an answer from one file would be read by the next.
  queryClient.clear();
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

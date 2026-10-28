import { vi } from 'vitest';

const realLocation = window.location;

/**
 * Stands in for the browser loading a page, which jsdom does not do.
 *
 * Signing out loads the login page rather than navigating to it, so a test of
 * it watches `location.replace` instead of the router.
 *
 * @returns The spy that stands in for the load, and a restore for afterEach.
 */
export function watchPageLoad() {
  const replace = vi.fn();

  Object.defineProperty(window, 'location', {
    value: { ...realLocation, replace },
    configurable: true,
  });

  return {
    replace,
    restore: () =>
      Object.defineProperty(window, 'location', {
        value: realLocation,
        configurable: true,
      }),
  };
}

import { isRedirect } from '@tanstack/react-router';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/* Reimported per case: whether handovers are on is module state in the bridge. */
async function loadRedirectToPage() {
  vi.resetModules();

  return {
    ...(await import('./redirect-to-page')),
    ...(await import('@irene/ember-bridge/handover')),
  };
}

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe('redirectToPage', () => {
  it('loads the Ember document for a path the ledger owns', async () => {
    const { redirectToPage, enableEmberHandover } = await loadRedirectToPage();

    enableEmberHandover();

    try {
      redirectToPage('/dashboard/home');
      expect.unreachable('the redirect should have been thrown');
    } catch (thrown) {
      expect(isRedirect(thrown)).toBe(true);

      expect(thrown).toMatchObject({
        options: { href: '/dashboard/home', reloadDocument: true, replace: true },
      });
    }
  });

  it('navigates within this app when the ledger does not own the path', async () => {
    const { redirectToPage } = await loadRedirectToPage();

    try {
      redirectToPage('/dashboard/home');
      expect.unreachable('the redirect should have been thrown');
    } catch (thrown) {
      expect(isRedirect(thrown)).toBe(true);
      expect(thrown).toMatchObject({ options: { to: '/dashboard/home', replace: true } });
      expect(thrown).not.toHaveProperty('options.reloadDocument', true);
    }
  });
});

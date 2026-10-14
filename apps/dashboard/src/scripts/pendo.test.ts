import { afterEach, describe, expect, it, vi } from 'vitest';

import {
  identifyForProductGuides,
  installProductGuides,
  PENDO_CONTAINER_ID,
  showProductGuides,
} from '@/scripts/pendo';

afterEach(() => {
  delete window.pendo;
  document.getElementById('pendo-agent')?.remove();
});

describe('installProductGuides', () => {
  it('loads the agent for the product it is registered as', () => {
    installProductGuides();

    expect(document.getElementById('pendo-agent')).toHaveAttribute(
      'src',
      'https://cdn.pendo.io/agent/static/f0a11665-8469-4c41-419f-b9f400b01f08/pendo.js'
    );
  });

  it('loads the agent an install names for itself', () => {
    installProductGuides('an-install-key');

    expect(document.getElementById('pendo-agent')).toHaveAttribute(
      'src',
      'https://cdn.pendo.io/agent/static/an-install-key/pendo.js'
    );
  });

  it('loads it once, however many times an account is loaded', () => {
    installProductGuides();
    installProductGuides();

    expect(document.querySelectorAll('#pendo-agent')).toHaveLength(1);
  });

  it('queues what is called before the agent has loaded, for it to replay', () => {
    installProductGuides();

    identifyForProductGuides({ id: 12, email: 'ada@appknox.com' });

    expect(window.pendo?._q).toEqual([
      [
        'initialize',
        { visitor: { id: 12, email: 'ada@appknox.com' }, account: { id: 'appknox.com' } },
      ],
    ]);
  });

  it('identifies the visitor before anything else the agent replays', () => {
    installProductGuides();

    window.pendo?.pageLoad?.();
    identifyForProductGuides({ id: 12, email: 'ada@appknox.com' });

    expect(window.pendo?._q?.map(([method]) => method)).toEqual(['initialize', 'pageLoad']);
  });

  it('leaves an agent that has already loaded alone', () => {
    const initialize = vi.fn();

    window.pendo = { initialize };

    installProductGuides();

    expect(window.pendo.initialize).toBe(initialize);
  });

  it('loads nothing for an install that names no agent', () => {
    installProductGuides('');

    expect(document.getElementById('pendo-agent')).toBeNull();
  });
});

describe('identifyForProductGuides', () => {
  it('counts one company as one account, by the domain its people sign in with', () => {
    const initialize = vi.fn();

    window.pendo = { initialize };

    identifyForProductGuides({ id: 12, email: 'ada@appknox.com' });

    expect(initialize).toHaveBeenCalledWith({
      visitor: { id: 12, email: 'ada@appknox.com' },
      account: { id: 'appknox.com' },
    });
  });

  it('does nothing while the agent is still loading', () => {
    expect(() => identifyForProductGuides({ id: 12, email: 'ada@appknox.com' })).not.toThrow();
  });
});

describe('showProductGuides', () => {
  it('shows the guide the badge on the navigation stands for', () => {
    const show = vi.fn();

    window.pendo = {
      getActiveGuides: () => [
        { launchMethod: 'api', show: vi.fn() },
        { launchMethod: 'auto-badge', show },
      ],
    };

    showProductGuides();

    expect(show).toHaveBeenCalledOnce();
  });

  it('shows nothing where no guide launches from the badge', () => {
    const show = vi.fn();

    window.pendo = { getActiveGuides: () => [{ launchMethod: 'api', show }] };

    showProductGuides();

    expect(show).not.toHaveBeenCalled();
  });

  it('does nothing on an install running no tour', () => {
    expect(showProductGuides).not.toThrow();
  });

  it('does nothing while the tour is still loading', () => {
    window.pendo = {};

    expect(showProductGuides).not.toThrow();
  });

  it('names the row the badge attaches itself to', () => {
    expect(PENDO_CONTAINER_ID).toBe('ak-pendo-version-container');
  });
});

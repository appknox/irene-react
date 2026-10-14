import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  hideFreshdeskLauncher,
  installFreshdesk,
  openFreshdesk,
  signOutOfFreshdesk,
} from '@/scripts/freshdesk';

import { FreshdeskEndpoints } from '@irene/api/services/freshdesk/endpoints';
import { server } from '@tests/server';

const widgetScript = () => document.getElementById('freshdesk-widget');

/** The widget as it behaves once its script has run, with its calls recorded. */
const installedWidget = () => {
  const widget = vi.fn();

  window.FreshworksWidget = widget;

  return widget;
};

/** Answers the token request with `token`, or with a 404 where the deployment holds no secret. */
const respondWithToken = (token: string | null) =>
  server.use(
    http.post(`*/${FreshdeskEndpoints.authenticate()}`, () =>
      token
        ? HttpResponse.json({ token, name: 'ada', email: 'ada@appknox.com' })
        : HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
    )
  );

beforeEach(() => {
  widgetScript()?.remove();
  delete window.FreshworksWidget;
  delete window.fwSettings;
});

describe('installFreshdesk', () => {
  it('adds the widget script for a deployment that names a widget', async () => {
    respondWithToken('a-jwt');

    await installFreshdesk('42');

    expect(widgetScript()).toHaveAttribute(
      'src',
      'https://ind-widget.freshworks.com/widgets/42.js'
    );

    expect(window.fwSettings).toEqual({ widget_id: '42' });
  });

  it('adds nothing for a deployment that names no widget', async () => {
    await installFreshdesk('');

    expect(widgetScript()).toBeNull();
    expect(window.fwSettings).toBeUndefined();
  });

  it('adds the script once, however many times an account is loaded', async () => {
    respondWithToken('a-jwt');

    await installFreshdesk('42');
    await installFreshdesk('42');

    expect(document.querySelectorAll('#freshdesk-widget')).toHaveLength(1);
  });

  it('queues the commands taken before the widget script has loaded', async () => {
    respondWithToken('a-jwt');

    await installFreshdesk('42');

    /* Both are queued before the script tag exists, so the widget replays them first. */
    expect(window.FreshworksWidget?.q).toEqual([
      ['authenticate', { token: 'a-jwt', callback: expect.any(Function) }],
      ['hide', 'launcher'],
    ]);

    expect(widgetScript()).not.toBeNull();
  });

  it('installs once when a second call arrives while the first awaits its token', async () => {
    respondWithToken('a-jwt');

    await Promise.all([installFreshdesk('42'), installFreshdesk('42')]);

    expect(document.querySelectorAll('#freshdesk-widget')).toHaveLength(1);
  });

  it('signs the account in and hides the widget launcher', async () => {
    const widget = installedWidget();

    respondWithToken('a-jwt');

    await installFreshdesk('42');

    expect(widget).toHaveBeenCalledWith('authenticate', {
      token: 'a-jwt',
      callback: expect.any(Function),
    });

    expect(widget).toHaveBeenCalledWith('hide', 'launcher');
  });

  it('installs the widget unauthenticated when the deployment holds no Freshdesk secret', async () => {
    const widget = installedWidget();
    const logged = vi.spyOn(window.console, 'error').mockImplementation(() => undefined);

    respondWithToken(null);

    await installFreshdesk('42');

    expect(widgetScript()).not.toBeNull();
    expect(widget).toHaveBeenCalledWith('hide', 'launcher');

    /* An empty token fails the widget's own bootstrap, so it is never sent. */
    expect(widget).not.toHaveBeenCalledWith('authenticate', expect.anything());

    /* A 404 is the deployment stating it has no secret, not a fault to report. */
    expect(logged).not.toHaveBeenCalled();

    logged.mockRestore();
  });

  it('reports a token request that fails for any reason but a missing secret', async () => {
    const logged = vi.spyOn(window.console, 'error').mockImplementation(() => undefined);

    installedWidget();

    server.use(
      http.post(`*/${FreshdeskEndpoints.authenticate()}`, () =>
        HttpResponse.json({ detail: 'Server error.' }, { status: 500 })
      )
    );

    await installFreshdesk('42');

    expect(logged).toHaveBeenCalled();

    logged.mockRestore();
  });

  it('asks for a fresh token when the widget reports the current one expired', async () => {
    const widget = installedWidget();

    respondWithToken('a-jwt');

    await installFreshdesk('42');

    const [, options] = widget.mock.calls.find(([command]) => command === 'authenticate') ?? [];

    respondWithToken('a-later-jwt');

    (options as { callback: () => void }).callback();

    await vi.waitFor(() =>
      expect(widget).toHaveBeenCalledWith('authenticate', {
        token: 'a-later-jwt',
        callback: expect.any(Function),
      })
    );
  });
});

describe('openFreshdesk', () => {
  it('opens the knowledge base once the widget has loaded', () => {
    const widget = installedWidget();

    openFreshdesk();

    expect(widget).toHaveBeenCalledWith('open');
  });

  it('does nothing while the widget is still loading', () => {
    expect(() => openFreshdesk()).not.toThrow();
  });
});

describe('hideFreshdeskLauncher', () => {
  it('hides the widget launcher once the widget has loaded', () => {
    const widget = installedWidget();

    hideFreshdeskLauncher();

    expect(widget).toHaveBeenCalledWith('hide', 'launcher');
  });
});

describe('signOutOfFreshdesk', () => {
  it('signs the account out once the widget has loaded', () => {
    const widget = installedWidget();

    signOutOfFreshdesk();

    expect(widget).toHaveBeenCalledWith('logout');
  });

  it('does nothing while the widget is still loading', () => {
    expect(() => signOutOfFreshdesk()).not.toThrow();
  });
});

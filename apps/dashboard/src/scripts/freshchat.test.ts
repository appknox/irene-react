import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import {
  closeFreshchat,
  destroyFreshchat,
  installFreshchat,
  toggleFreshchat,
  type FreshchatIdentity,
} from '@/scripts/freshchat';

const IDENTITY: FreshchatIdentity = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@appknox.com',
  organizationName: 'Appknox',
  hash: 'a-freshchat-hash',
};

const widgetScript = () => document.getElementById('freshchat-widget');

/**
 * The widget as it behaves once its script has run, with its calls recorded.
 *
 * A test that needs it to answer — a chat already open, an account the widget
 * knows — says so on the mock it gets back.
 *
 * @returns The widget, installed and ready to be asserted on.
 */
const installedWidget = () => {
  const widget = {
    open: vi.fn(),
    close: vi.fn(),
    isOpen: vi.fn(() => false),
    destroy: vi.fn(),
    on: vi.fn(),
    user: { get: vi.fn(), create: vi.fn(), setProperties: vi.fn() },
  };

  window.fcWidget = widget;

  return widget;
};

/** Runs what the widget calls once it has loaded, which is where the account is identified. */
const runOnInit = () => (window.fcSettings?.onInit as () => void)();

beforeEach(() => {
  widgetScript()?.remove();
  delete window.fcWidget;
  delete window.fcSettings;
  delete window.fcWidgetMessengerConfig;
});

afterEach(() => {
  window.localStorage.clear();
});

describe('installFreshchat', () => {
  it('adds the widget script for an install that carries a key', () => {
    installFreshchat('a-key', IDENTITY);

    expect(widgetScript()).toHaveAttribute(
      'src',
      'https://appknox-support.freshchat.com/js/widget.js'
    );
  });

  it('adds nothing for an install that carries no key', () => {
    installFreshchat('', IDENTITY);

    expect(widgetScript()).toBeNull();
    expect(window.fcSettings).toBeUndefined();
  });

  it('adds the script once, however many times an account is loaded', () => {
    installFreshchat('a-key', IDENTITY);
    installFreshchat('a-key', IDENTITY);

    expect(document.querySelectorAll('#freshchat-widget')).toHaveLength(1);
  });

  it('hides the widget launcher, since the navigation opens it instead', () => {
    installFreshchat('a-key', IDENTITY);

    expect(window.fcWidgetMessengerConfig).toMatchObject({
      config: { headerProperty: { hideChatButton: true } },
      externalId: IDENTITY.hash,
    });
  });

  it('restores the conversation this account was last in', () => {
    window.localStorage.setItem(IDENTITY.hash, 'a-restore-id');

    installFreshchat('a-key', IDENTITY);

    expect(window.fcWidgetMessengerConfig?.restoreId).toBe('a-restore-id');
  });

  it('starts a conversation where storage holds none', () => {
    installFreshchat('a-key', IDENTITY);

    expect(window.fcWidgetMessengerConfig?.restoreId).toBeNull();
  });

  it('creates the account with the widget when it holds no record of it', () => {
    const widget = installedWidget();

    widget.user.get.mockImplementation((handler) => handler({ status: 404 }));

    installFreshchat('a-key', IDENTITY);
    runOnInit();

    expect(widget.user.create).toHaveBeenCalledWith({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@appknox.com',
      cf_custom_company_name: 'Appknox',
    });
  });

  it('names the organization on an account it already holds, and remembers the conversation', () => {
    const widget = installedWidget();

    widget.user.get.mockImplementation((handler) =>
      handler({ status: 200, data: { restoreId: 'a-restore-id' } })
    );

    installFreshchat('a-key', IDENTITY);
    runOnInit();

    expect(widget.user.setProperties).toHaveBeenCalledWith({ cf_custom_company_name: 'Appknox' });
    expect(window.localStorage.getItem(IDENTITY.hash)).toBe('a-restore-id');
  });

  it('remembers the conversation the widget opens for an account it has just created', () => {
    const widget = installedWidget();

    installFreshchat('a-key', IDENTITY);
    runOnInit();

    const [, created] = widget.on.mock.calls[0] ?? [];

    created?.({ status: 200, data: { restoreId: 'a-new-restore-id' } });

    expect(window.localStorage.getItem(IDENTITY.hash)).toBe('a-new-restore-id');
  });

  it('remembers nothing from a request the widget refused', () => {
    const widget = installedWidget();

    installFreshchat('a-key', IDENTITY);
    runOnInit();

    const [, created] = widget.on.mock.calls[0] ?? [];

    created?.({ status: 500 });

    expect(window.localStorage.getItem(IDENTITY.hash)).toBeNull();
  });

  it('carries on where the widget has not defined itself yet', () => {
    installFreshchat('a-key', IDENTITY);

    expect(runOnInit).not.toThrow();
  });
});

describe('toggleFreshchat', () => {
  it('opens a chat that is closed', () => {
    const widget = installedWidget();

    toggleFreshchat();

    expect(widget.open).toHaveBeenCalledOnce();
  });

  it('closes a chat that is open, so the same row puts it away', () => {
    const widget = installedWidget();

    widget.isOpen.mockReturnValue(true);

    toggleFreshchat();

    expect(widget.close).toHaveBeenCalledOnce();
    expect(widget.open).not.toHaveBeenCalled();
  });

  it('does nothing on an install with no widget', () => {
    expect(toggleFreshchat).not.toThrow();
  });
});

describe('closeFreshchat', () => {
  it('closes a chat that is open, for a click that moves the page on', () => {
    const widget = installedWidget();

    widget.isOpen.mockReturnValue(true);

    closeFreshchat();

    expect(widget.close).toHaveBeenCalledOnce();
  });

  it('leaves a chat that is already closed alone', () => {
    const widget = installedWidget();

    closeFreshchat();

    expect(widget.close).not.toHaveBeenCalled();
  });

  it('does nothing on an install with no widget', () => {
    expect(closeFreshchat).not.toThrow();
  });
});

describe('destroyFreshchat', () => {
  it('removes the widget, for an account that signs out', () => {
    const widget = installedWidget();

    destroyFreshchat();

    expect(widget.destroy).toHaveBeenCalledOnce();
  });

  it('does nothing on an install with no widget', () => {
    expect(destroyFreshchat).not.toThrow();
  });
});

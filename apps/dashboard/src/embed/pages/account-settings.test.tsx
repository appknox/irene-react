import { render, screen, waitFor } from '@testing-library/react';
import { createElement } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AccountSettings } from './account-settings';

/*
  The panes are whole screens of their own; this covers the router around them,
  so each stands in as the text its path should land on.
*/
vi.mock('@/features/account-settings', async () => {
  const { Outlet } = await import('@tanstack/react-router');

  return { AccountSettingsLayout: () => createElement(Outlet) };
});

vi.mock('@/features/account-settings/pages/general', () => ({
  GeneralSettingsPage: () => 'general pane',
}));

vi.mock('@/features/account-settings/pages/security', () => ({
  SecuritySettingsPage: () => 'security pane',
}));

vi.mock('@/features/account-settings/pages/developer-settings', () => ({
  DeveloperSettingsPage: () => 'developer pane',
}));

vi.mock('@/features/account-settings/pages/cyod-settings', () => ({
  CyodSettingsPage: () => 'cyod pane',
}));

vi.mock('@/features/account-settings/pages/notification-settings', () => ({
  NotificationSettingsPage: () => 'notification pane',
}));

/** Puts the host at an address, the way it would be before the screen mounts. */
const hostIsAt = (pathname: string) => window.history.replaceState({}, '', pathname);

describe('the embedded account settings screen', () => {
  beforeEach(() => {
    hostIsAt('/');
  });

  it.each([
    ['the pane the address names', '/dashboard/settings/security', 'security pane'],
    ['the developer pane', '/dashboard/settings/developersettings', 'developer pane'],
    ['the CYOD pane', '/dashboard/settings/cyod-settings', 'cyod pane'],
    ['the notification pane', '/dashboard/settings/notification-settings', 'notification pane'],
    [
      'the general pane where the address names no tab of this screen',
      '/dashboard/home',
      'general pane',
    ],
    [
      'the general pane where the address names the screen but no tab',
      '/dashboard/settings',
      'general pane',
    ],
  ])('opens %s', async (_description, pathname, pane) => {
    hostIsAt(pathname);

    render(<AccountSettings />);

    expect(await screen.findByText(pane)).toBeInTheDocument();
  });

  it('writes the open tab to the address bar, so a tab stays linkable', async () => {
    hostIsAt('/dashboard/home');

    render(<AccountSettings />);

    await screen.findByText('general pane');

    await waitFor(() => expect(window.location.pathname).toBe('/dashboard/settings/general'));
  });

  it('leaves the address alone where it already names the open tab', async () => {
    hostIsAt('/dashboard/settings/security');

    const replaceState = vi.spyOn(window.history, 'replaceState');

    render(<AccountSettings />);

    await screen.findByText('security pane');

    expect(replaceState).not.toHaveBeenCalled();
  });
});

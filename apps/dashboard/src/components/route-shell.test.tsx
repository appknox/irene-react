import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { RouteShell } from '@/components/route-shell';
import { renderWithProviders } from '@tests/render';

const realLocation = window.location;

/**
 * Puts the browser on a path and stands in for it loading a page, which jsdom
 * does not do. The path is set first, since the stub copies it.
 */
function standOn(pathname: string) {
  window.history.replaceState(null, '', pathname);

  const replace = vi.fn();

  Object.defineProperty(window, 'location', {
    value: { ...realLocation, pathname, replace },
    configurable: true,
  });

  return replace;
}

describe('RouteShell', () => {
  afterEach(() => {
    Object.defineProperty(window, 'location', { value: realLocation, configurable: true });
    window.sessionStorage.clear();
    window.history.replaceState(null, '', '/');
  });

  it('loads the Ember app for a screen it still serves', () => {
    const pageLoad = standOn('/dashboard/marketplace');

    renderWithProviders(<RouteShell name="Marketplace" />);

    expect(pageLoad).toHaveBeenCalledWith('/marketplace');
    expect(screen.queryByText('Marketplace')).not.toBeInTheDocument();
  });

  it('carries the rest of the path, so an id reaches the Ember app', () => {
    const pageLoad = standOn('/dashboard/file/42');

    renderWithProviders(<RouteShell name="File" />);

    expect(pageLoad).toHaveBeenCalledWith('/file/42');
  });

  it('names the screen where no Ember page is mapped', () => {
    const pageLoad = standOn('/dashboard/home');

    renderWithProviders(<RouteShell name="Home" />);

    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('This screen has not been migrated yet.')).toBeInTheDocument();
    expect(pageLoad).not.toHaveBeenCalled();
  });

  it('stops after one attempt, so a handover that does not land is not retried', () => {
    const pageLoad = standOn('/dashboard/marketplace');

    const first = renderWithProviders(<RouteShell name="Marketplace" />);

    expect(pageLoad).toHaveBeenCalledOnce();

    first.unmount();
    render(<RouteShell name="Marketplace" />);

    expect(pageLoad).toHaveBeenCalledOnce();
    expect(screen.getByText('This screen has not been migrated yet.')).toBeInTheDocument();
  });

  it('hands over again on a later visit, once the first had time to land', () => {
    vi.useFakeTimers();

    const pageLoad = standOn('/dashboard/marketplace');

    const first = renderWithProviders(<RouteShell name="Marketplace" />);

    first.unmount();
    vi.advanceTimersByTime(5_001);

    render(<RouteShell name="Marketplace" />);

    expect(pageLoad).toHaveBeenCalledTimes(2);

    vi.useRealTimers();
  });
});

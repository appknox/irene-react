import { act, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { TranslationsProvider } from '@irene/translations/provider';
import { RoutePending } from '@/components/route-pending';

/** The bar's current value, so a missing bar fails the assertion rather than reading as zero. */
const progressValue = () => screen.getByRole<HTMLProgressElement>('progressbar').value;

const renderPending = () =>
  render(
    <TranslationsProvider>
      <RoutePending />
    </TranslationsProvider>
  );

describe('RoutePending', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the label and the progress bar', () => {
    renderPending();

    expect(screen.getByRole('status')).toHaveAccessibleName(akMT('loadingTheDashboard'));
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it("advances the bar's progress value", () => {
    renderPending();

    const started = progressValue();

    act(() => vi.advanceTimersByTime(1000));

    const moved = progressValue();

    expect(moved).toBeGreaterThan(started);

    act(() => vi.advanceTimersByTime(1000));

    expect(progressValue()).toBeGreaterThan(moved);
  });

  it('holds the progress bar short of 100 percent however long the wait runs', () => {
    renderPending();

    act(() => vi.advanceTimersByTime(60_000));

    expect(progressValue()).toBeLessThan(100);
  });

  it('says nothing about the wait in its first ten seconds', () => {
    renderPending();

    act(() => vi.advanceTimersByTime(9_000));

    expect(
      screen.queryByText(akMT('bootLoadingScreenMsg.stillGettingThingsReady'))
    ).not.toBeInTheDocument();

    expect(screen.queryByText(akMT('bootLoadingScreenMsg.almostThere'))).not.toBeInTheDocument();
    expect(screen.queryByText(akMT('bootLoadingScreenMsg.thanksForYourPatience'))).not.toBeInTheDocument();
  });

  it.each([
    [10_000, akMT('bootLoadingScreenMsg.stillGettingThingsReady')],
    [25_000, akMT('bootLoadingScreenMsg.almostThere')],
    [40_000, akMT('bootLoadingScreenMsg.thanksForYourPatience')],
  ])('says more about the wait once %i ms have passed', (waited, message) => {
    renderPending();

    act(() => vi.advanceTimersByTime(waited));

    expect(screen.getByText(message)).toBeInTheDocument();
  });

  it('replaces each message with the next rather than stacking them', () => {
    renderPending();

    act(() => vi.advanceTimersByTime(25_000));

    expect(
      screen.queryByText(akMT('bootLoadingScreenMsg.stillGettingThingsReady'))
    ).not.toBeInTheDocument();

    expect(screen.getByText(akMT('bootLoadingScreenMsg.almostThere'))).toBeInTheDocument();
  });

  it('swaps the illustration every second and clears its timers on unmount', () => {
    const { container, unmount } = renderPending();

    const first = container.querySelector('svg')?.innerHTML;

    act(() => vi.advanceTimersByTime(1000));

    expect(container.querySelector('svg')?.innerHTML).not.toBe(first);

    unmount();

    expect(vi.getTimerCount()).toBe(0);
  });
});

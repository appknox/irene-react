import { faker } from '@faker-js/faker';
import { within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { renderWithProviders } from '@tests/render';

import { CalendarTooltip } from './calendar-tooltip';
import type { ScannedApp } from './apps-by-date';

/** How many apps the tooltip names before it counts the rest. */
const NAMED = 15;

/** One app's scanning on the day, counted the way the calendar hands it over. */
const buildDayApp = (overrides: Partial<ScannedApp> = {}): ScannedApp => ({
  packageName: faker.internet.domainName().split('.').reverse().join('.'),
  platform: '0',
  count: faker.number.int({ min: 1, max: 99 }),
  ...overrides,
});

/** The apps of a day, busiest first, as the calendar orders them. */
const buildDayApps = (howMany: number) =>
  Array.from({ length: howMany }, (_, app) => buildDayApp({ count: howMany - app }));

/** A page of a known size, so the placing below can be measured against it. */
const sizePage = () => {
  window.innerWidth = 1000;
  window.innerHeight = 800;
};

/** Somewhere on that page for the tooltip to place itself by. */
const pointerAt = (x: number, y: number) => ({ x, y });

/** The tooltip, which is drawn on the page body rather than inside the calendar. */
function tooltip() {
  const drawn = document.body.querySelector<HTMLElement>('[data-test-calendar-tooltip]');

  if (!drawn) {
    throw new Error('The tooltip was not drawn.');
  }

  return drawn;
}

describe('CalendarTooltip', () => {
  beforeEach(() => {
    sizePage();
  });

  it('heads the day with everything scanned on it', () => {
    const apps = [buildDayApp({ count: 12 }), buildDayApp({ count: 30 })];

    renderWithProviders(
      <CalendarTooltip day="2026-04-03" apps={apps} pointer={pointerAt(100, 100)} />
    );

    expect(tooltip()).toHaveTextContent('Apr 3, 2026');
    expect(tooltip()).toHaveTextContent(`42 ${akMT('files')}`);
  });

  it('names every app and its count', () => {
    const apps = buildDayApps(3);

    renderWithProviders(
      <CalendarTooltip day="2026-04-03" apps={apps} pointer={pointerAt(100, 100)} />
    );

    apps.forEach((app) => {
      expect(tooltip()).toHaveTextContent(app.packageName);
      expect(tooltip()).toHaveTextContent(String(app.count));
    });
  });

  it('counts the apps it had no room for, and says where to read them', () => {
    const apps = buildDayApps(NAMED + 4);

    renderWithProviders(
      <CalendarTooltip day="2026-04-03" apps={apps} pointer={pointerAt(100, 100)} />
    );

    expect(within(tooltip()).getAllByRole('listitem')).toHaveLength(NAMED);
    expect(tooltip()).toHaveTextContent('+4');
    expect(tooltip()).toHaveTextContent(akMT('analyticsModule.clickToViewAll'));
  });

  it('says nothing about a remainder when it named them all', () => {
    renderWithProviders(
      <CalendarTooltip day="2026-04-03" apps={buildDayApps(NAMED)} pointer={pointerAt(100, 100)} />
    );

    expect(tooltip()).not.toHaveTextContent(akMT('analyticsModule.clickToViewAll'));
  });

  it('hangs below and to the right of a pointer in the top left', () => {
    renderWithProviders(
      <CalendarTooltip day="2026-04-03" apps={buildDayApps(1)} pointer={pointerAt(100, 100)} />
    );

    expect(tooltip()).toHaveStyle({ top: '116px', left: '116px', maxHeight: '672px' });
  });

  it('is pinned by the edges facing a pointer in the bottom right', () => {
    renderWithProviders(
      <CalendarTooltip day="2026-04-03" apps={buildDayApps(1)} pointer={pointerAt(900, 700)} />
    );

    expect(tooltip()).toHaveStyle({ bottom: '116px', right: '116px', maxHeight: '672px' });
  });
});

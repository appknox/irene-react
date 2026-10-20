import { faker } from '@faker-js/faker';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';

import { renderWithProviders } from '@tests/render';

import { DayDetailDrawer } from './day-detail-drawer';
import type { ScannedApp } from './apps-by-date';

/** One app's scanning on the day, counted the way the calendar hands it over. */
const buildDayApp = (overrides: Partial<ScannedApp> = {}): ScannedApp => ({
  packageName: faker.internet.domainName().split('.').reverse().join('.'),
  platform: String(ENUMS.PLATFORM.ANDROID),
  count: faker.number.int({ min: 1, max: 99 }),
  ...overrides,
});

const drawer = () => screen.findByRole('dialog');

describe('DayDetailDrawer', () => {
  it('heads the drawer with the day it is reading', async () => {
    renderWithProviders(
      <DayDetailDrawer day="2026-04-03" apps={[buildDayApp()]} onClose={vi.fn()} />
    );

    expect(await drawer()).toHaveTextContent('Apr 3, 2026');
  });

  it('adds up what was scanned and how many apps it was spread over', async () => {
    const apps = [buildDayApp({ count: 12 }), buildDayApp({ count: 30 })];

    renderWithProviders(<DayDetailDrawer day="2026-04-03" apps={apps} onClose={vi.fn()} />);

    expect(await drawer()).toHaveTextContent('42');
    expect(await drawer()).toHaveTextContent(`2${akMT('analyticsModule.appsScanned')}`);
  });

  it('splits the day between the platforms', async () => {
    const apps = [
      buildDayApp({ count: 30, platform: String(ENUMS.PLATFORM.ANDROID) }),
      buildDayApp({ count: 10, platform: String(ENUMS.PLATFORM.IOS) }),
    ];

    renderWithProviders(<DayDetailDrawer day="2026-04-03" apps={apps} onClose={vi.fn()} />);

    expect(await drawer()).toHaveTextContent(`${akMT('android')} · 30`);
    expect(await drawer()).toHaveTextContent(`${akMT('ios')} · 10`);
  });

  it('leaves the split empty where nothing was scanned', async () => {
    const apps = [buildDayApp({ count: 0, platform: String(ENUMS.PLATFORM.ANDROID) })];

    renderWithProviders(<DayDetailDrawer day="2026-04-03" apps={apps} onClose={vi.fn()} />);

    expect(await drawer()).toHaveTextContent(`${akMT('android')} · 0`);
    expect(await drawer()).toHaveTextContent(`${akMT('ios')} · 0`);
  });

  it('lists every app with its platform and its count', async () => {
    const android = buildDayApp({ platform: String(ENUMS.PLATFORM.ANDROID) });
    const ios = buildDayApp({ platform: String(ENUMS.PLATFORM.IOS) });

    renderWithProviders(
      <DayDetailDrawer day="2026-04-03" apps={[android, ios]} onClose={vi.fn()} />
    );

    const rows = within(await drawer()).getAllByRole('listitem');

    expect(rows).toHaveLength(2);
    expect(rows[0]).toHaveTextContent(android.packageName);
    expect(rows[0]).toHaveTextContent(String(android.count));
    expect(within(rows[0]!).getByLabelText(akMT('android'))).toBeInTheDocument();
    expect(within(rows[1]!).getByLabelText(akMT('ios'))).toBeInTheDocument();
  });

  it('names a platform by its number where it has no name of its own', async () => {
    renderWithProviders(
      <DayDetailDrawer
        day="2026-04-03"
        apps={[buildDayApp({ platform: '99' })]}
        onClose={vi.fn()}
      />
    );

    expect(within(await drawer()).getByLabelText('99')).toBeInTheDocument();
  });

  it('shadows the summary once the list behind it is scrolled', async () => {
    const summary = (dialog: HTMLElement) =>
      dialog.querySelector('[data-slot="drawer-body"] > div');

    renderWithProviders(
      <DayDetailDrawer day="2026-04-03" apps={[buildDayApp()]} onClose={vi.fn()} />
    );

    const dialog = await drawer();
    const body = dialog.querySelector('[data-slot="drawer-body"]');

    expect(summary(dialog)).not.toHaveClass('shadow-19');

    if (body) {
      fireEvent.scroll(body, { target: { scrollTop: 40 } });
    }

    await waitFor(() => expect(summary(dialog)).toHaveClass('shadow-19'));
  });

  it('stays shut until a day is given', () => {
    renderWithProviders(<DayDetailDrawer apps={[]} onClose={vi.fn()} />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('reports being dismissed', async () => {
    const onClose = vi.fn();

    renderWithProviders(
      <DayDetailDrawer day="2026-04-03" apps={[buildDayApp()]} onClose={onClose} />
    );

    await userEvent.click(within(await drawer()).getByRole('button', { name: akMT('close') }));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
});

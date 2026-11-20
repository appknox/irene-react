import { screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { buildBrandAbuseSkFakeApp } from '@tests/factories';
import { renderWithRouterContext } from '@tests/render';

import { FakeAppTabTable } from './fake-app-tab-table';

describe('the fake-app tab table', () => {
  it('draws an action column from renderAction, one cell per copy', async () => {
    const copies = [buildBrandAbuseSkFakeApp(), buildBrandAbuseSkFakeApp()];

    renderWithRouterContext(
      <FakeAppTabTable
        skAppId="1"
        apps={copies}
        renderAction={(app) => <button type="button">{`act on ${app.title}`}</button>}
      />
    );

    expect(await screen.findByRole('columnheader', { name: akMT('action') })).toBeVisible();

    for (const copy of copies) {
      const row = screen.getByText(copy.title).closest('tr');

      expect(
        within(row as HTMLElement).getByRole('button', { name: `act on ${copy.title}` })
      ).toBeVisible();
    }
  });

  it('shows five placeholder rows, with an action placeholder, while the page loads', async () => {
    renderWithRouterContext(
      <FakeAppTabTable skAppId="1" renderAction={() => <button type="button">act</button>} />
    );

    expect(await screen.findByRole('columnheader', { name: akMT('action') })).toBeVisible();

    /* The header row and five placeholder rows. */
    expect(screen.getAllByRole('row')).toHaveLength(6);
    expect(screen.queryByRole('button', { name: 'act' })).not.toBeInTheDocument();
  });
});

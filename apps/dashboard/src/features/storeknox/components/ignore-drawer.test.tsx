import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { StoreknoxEndpoints } from '@irene/api/services/storeknox';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkToaster } from '@irene/ui/ak-toaster';

import {
  buildAddedToInventorySkFakeApp,
  buildBrandAbuseSkFakeApp,
  buildIgnoredSkFakeApp,
  buildSkFakeApp,
} from '@tests/factories';

import { renderWithRouterContext } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';
import { mockSkFakeAppReview } from '@tests/storeknox';

import { IgnoreDrawer } from './ignore-drawer';

const SK_APP_ID = faker.number.int({ min: 1, max: 999 });

function renderDrawer(
  fakeApp = buildBrandAbuseSkFakeApp(),
  { addToInventory = false, onClose = vi.fn() } = {}
) {
  renderWithRouterContext(
    <>
      <IgnoreDrawer
        skAppId={SK_APP_ID}
        fakeApp={fakeApp}
        addToInventory={addToInventory}
        open
        onClose={onClose}
      />

      <AkToaster />
    </>
  );

  return { fakeApp, onClose };
}

const confirmButton = (name: string) => screen.findByRole('button', { name });

describe('the ignore drawer', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('keeps confirm disabled until a reason other than spaces is typed', async () => {
    renderDrawer();

    const confirm = await confirmButton(akMT('storeknox.yesIgnore'));
    const reason = screen.getByRole('textbox', { name: akMT('reason') });

    expect(confirm).toBeDisabled();

    await userEvent.type(reason, '   ');

    expect(confirm).toBeDisabled();
    expect(await screen.findByText(akMT('storeknox.ignoreReasonRequired'))).toBeVisible();

    await userEvent.type(reason, 'official partner');

    await waitFor(() => expect(confirm).toBeEnabled());
  });

  it('posts the reason and shows the brand-abuse ignore toast', async () => {
    const fakeApp = buildBrandAbuseSkFakeApp();
    const reason = faker.lorem.sentence();

    const bodies = mockSkFakeAppReview(SK_APP_ID, fakeApp.id, 'ignore', {
      id: fakeApp.id,
      status: fakeApp.status,
      status_display: fakeApp.status_display,
      reviewed_by: faker.person.fullName(),
      reviewed_on: faker.date.recent().toISOString(),
      ignore_reason: reason,
    });

    const { onClose } = renderDrawer(fakeApp);

    expect(await screen.findByText(fakeApp.title)).toBeVisible();

    await userEvent.type(screen.getByRole('textbox', { name: akMT('reason') }), reason);

    await userEvent.click(await confirmButton(akMT('storeknox.yesIgnore')));

    expect(await screen.findByText(akMT('storeknox.appIgnoredSuccessfully'))).toBeVisible();
    expect(bodies).toEqual([{ ignore_reason: reason }]);
    expect(onClose).toHaveBeenCalled();
  });

  it('shows the fake-app add-to-inventory toast', async () => {
    const fakeApp = buildSkFakeApp({ ai_classification_label: 'fake_app' });
    const reason = faker.lorem.sentence();

    const bodies = mockSkFakeAppReview(SK_APP_ID, fakeApp.id, 'add-to-inventory', {
      id: fakeApp.id,
      status: fakeApp.status,
      status_display: fakeApp.status_display,
      reviewed_by: faker.person.fullName(),
      reviewed_on: faker.date.recent().toISOString(),
    });

    renderDrawer(fakeApp, { addToInventory: true });

    await userEvent.type(await screen.findByRole('textbox', { name: akMT('reason') }), reason);

    await userEvent.click(await confirmButton(akMT('storeknox.yesIgnoreAndAddToInventory')));

    expect(
      await screen.findByText(akMT('storeknox.fakeAppIgnoredAndAddedToInventory'))
    ).toBeVisible();

    expect(bodies).toEqual([{ ignore_reason: reason }]);
  });

  it("shows the server's reason when the review fails and stays open", async () => {
    const fakeApp = buildBrandAbuseSkFakeApp();
    const detail = faker.lorem.sentence();

    server.use(
      http.post(buildAPITestURL(StoreknoxEndpoints.ignoreFakeApp(SK_APP_ID, fakeApp.id)), () =>
        HttpResponse.json({ detail }, { status: 400 })
      )
    );

    const { onClose } = renderDrawer(fakeApp);

    await userEvent.type(
      await screen.findByRole('textbox', { name: akMT('reason') }),
      faker.lorem.word()
    );

    await userEvent.click(await confirmButton(akMT('storeknox.yesIgnore')));

    expect(await screen.findByText(detail)).toBeVisible();
    expect(onClose).not.toHaveBeenCalled();
    expect(screen.getByRole('textbox', { name: akMT('reason') })).toBeVisible();
  });

  it("shows an ignored copy's date, reviewer and reason read-only", async () => {
    const fakeApp = buildIgnoredSkFakeApp();

    renderDrawer(fakeApp);

    expect(await screen.findByText(akMT('storeknox.ignoredDetails'))).toBeVisible();
    expect(screen.getByText(akMT('storeknox.ignoredOn'))).toBeVisible();
    expect(screen.getByText(formatDateTime(fakeApp.reviewed_on, 'longDate'))).toBeVisible();
    expect(screen.getByText(akMT('storeknox.ignoredBy'))).toBeVisible();
    expect(screen.getByText(String(fakeApp.reviewed_by))).toBeVisible();
    expect(screen.getByText(String(fakeApp.ignore_reason))).toBeVisible();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

    expect(
      screen.queryByRole('link', { name: akMT('storeknox.viewInInventory') })
    ).not.toBeInTheDocument();
  });

  it('uses the added-to-inventory wording and links to the inventory app only when there is an id', async () => {
    const fakeApp = buildAddedToInventorySkFakeApp();

    const { unmount } = renderWithRouterContext(
      <IgnoreDrawer
        skAppId={SK_APP_ID}
        fakeApp={fakeApp}
        addToInventory={false}
        open
        onClose={vi.fn()}
      />
    );

    expect(await screen.findByText(akMT('storeknox.ignoredAndAddedToInventoryOn'))).toBeVisible();
    expect(screen.getByText(akMT('storeknox.ignoredAndAddedToInventoryBy'))).toBeVisible();

    expect(screen.getByRole('link', { name: akMT('storeknox.viewInInventory') })).toHaveAttribute(
      'href',
      `/dashboard/storeknox/inventory-details/${fakeApp.added_to_inventory_app}`
    );

    unmount();

    renderDrawer(buildAddedToInventorySkFakeApp({ added_to_inventory_app: null }));

    expect(await screen.findByText(akMT('storeknox.ignoredAndAddedToInventoryOn'))).toBeVisible();

    expect(
      screen.queryByRole('link', { name: akMT('storeknox.viewInInventory') })
    ).not.toBeInTheDocument();
  });

  it('resets the reason when closed', async () => {
    const fakeApp = buildBrandAbuseSkFakeApp();
    const typed = faker.lorem.word();

    function Harness() {
      const [open, setOpen] = useState(true);

      return (
        <>
          <button type="button" onClick={() => setOpen(true)}>
            reopen
          </button>

          <IgnoreDrawer
            skAppId={SK_APP_ID}
            fakeApp={fakeApp}
            addToInventory={false}
            open={open}
            onClose={() => setOpen(false)}
          />
        </>
      );
    }

    renderWithRouterContext(<Harness />);

    await userEvent.type(await screen.findByRole('textbox', { name: akMT('reason') }), typed);

    await userEvent.click(screen.getByRole('button', { name: akMT('close') }));

    await waitFor(() => expect(screen.queryByRole('textbox')).not.toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: 'reopen' }));

    expect(await screen.findByRole('textbox', { name: akMT('reason') })).toHaveValue('');
  });

  it('keeps the confirmation while it closes after the merged ignored status arrives', async () => {
    const fakeApp = buildBrandAbuseSkFakeApp();
    const reason = faker.lorem.sentence();

    mockSkFakeAppReview(SK_APP_ID, fakeApp.id, 'ignore', {
      id: fakeApp.id,
      status: fakeApp.status,
      status_display: fakeApp.status_display,
      reviewed_by: faker.person.fullName(),
      reviewed_on: faker.date.recent().toISOString(),
    });

    /* jsdom runs no animations, so a closing animation is declared to hold the content mounted. */
    const computedStyle = globalThis.getComputedStyle.bind(globalThis);

    vi.spyOn(globalThis, 'getComputedStyle').mockImplementation(
      (element, pseudo) =>
        new Proxy(computedStyle(element, pseudo), {
          get: (style, property) =>
            property === 'animationName' && element.getAttribute('data-state') === 'closed'
              ? 'drawer-out'
              : Reflect.get(style, property),
        })
    );

    function Harness() {
      const [open, setOpen] = useState(true);
      const [copy, setCopy] = useState(fakeApp);

      return (
        <IgnoreDrawer
          skAppId={SK_APP_ID}
          fakeApp={copy}
          addToInventory={false}
          open={open}
          onClose={() => {
            setCopy(buildIgnoredSkFakeApp({ id: fakeApp.id, title: fakeApp.title }));
            setOpen(false);
          }}
        />
      );
    }

    renderWithRouterContext(<Harness />);

    await userEvent.type(await screen.findByRole('textbox', { name: akMT('reason') }), reason);
    await userEvent.click(await confirmButton(akMT('storeknox.yesIgnore')));

    await waitFor(() =>
      expect(document.querySelector('[data-test-sk-ignore-drawer]')).toHaveAttribute(
        'data-state',
        'closed'
      )
    );

    expect(screen.getByText(akMT('confirmation'))).toBeVisible();
    expect(screen.queryByText(akMT('storeknox.ignoredDetails'))).not.toBeInTheDocument();
  });
});

import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { ENUMS } from '@irene/enums';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildOrganizationNamespace, buildSession } from '@tests/factories';
import { mockOrganizationMe } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { server } from '@tests/server';

const NAMESPACES_ROUTE = '/dashboard/organization/namespaces';

/** Answers the namespaces list with these rows, and a count across every page. */
const withNamespaces = (
  namespaces: ReturnType<typeof buildOrganizationNamespace>[],
  count = namespaces.length
) =>
  server.use(
    http.get(`*/${OrganizationEndpoints.namespaces('*')}`, () =>
      HttpResponse.json({ count, next: null, previous: null, results: namespaces })
    )
  );

/** Answers the member lookup each row makes for the name beside its date. */
const withMember = (username: string) =>
  server.use(
    http.get('*/api/organizations/:organizationId/users/:userId', () =>
      HttpResponse.json({ id: 1, username, email: 'a@b.test', is_active: true })
    )
  );

describe('OrganizationNamespacesPage', () => {
  beforeEach(() => {
    clearStoredSession();
    storeSession(buildSession());
    withMember('alice');
  });

  it('lists a namespace with the platform it was claimed for', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: false });
    withNamespaces([buildOrganizationNamespace({ value: 'com.example.app' })]);

    await renderAtRoute(NAMESPACES_ROUTE);

    expect(await screen.findByText('com.example.app')).toBeInTheDocument();
  });

  it('names the member who asked for it', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: false });
    withNamespaces([buildOrganizationNamespace({ requested_by: 1 })]);

    await renderAtRoute(NAMESPACES_ROUTE);

    expect(await screen.findByText('alice')).toBeInTheDocument();
  });

  it('tells an admin there are none, rather than that none were asked for', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: true });
    withNamespaces([]);

    await renderAtRoute(NAMESPACES_ROUTE);

    expect(await screen.findByText(akMT('noNamespace'))).toBeInTheDocument();
  });

  it('tells everyone else that none were asked for', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: false });
    withNamespaces([]);

    await renderAtRoute(NAMESPACES_ROUTE);

    expect(await screen.findByText(akMT('noNamespaceRequested'))).toBeInTheDocument();
  });

  it('offers an owner the approve and reject controls', async () => {
    mockOrganizationMe({ is_owner: true, is_admin: true });
    withNamespaces([buildOrganizationNamespace({ is_approved: false })]);

    await renderAtRoute(NAMESPACES_ROUTE);

    expect(await screen.findByRole('button', { name: akMT('approve') })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: akMT('reject') })).toBeInTheDocument();
  });

  it('tells anyone else the request is still open', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: false });
    withNamespaces([buildOrganizationNamespace({ is_approved: false })]);

    await renderAtRoute(NAMESPACES_ROUTE);

    expect(await screen.findByText(akMT('chipStatus.pending'))).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: akMT('approve') })).not.toBeInTheDocument();
  });

  it('says so once a namespace is approved', async () => {
    const user = userEvent.setup();
    const namespace = buildOrganizationNamespace({ is_approved: false });

    mockOrganizationMe({ is_owner: true, is_admin: true });
    withNamespaces([namespace]);

    server.use(
      http.put('*/api/organizations/:organizationId/namespaces/:namespaceId', () =>
        HttpResponse.json({ ...namespace, is_approved: true })
      )
    );

    await renderAtRoute(NAMESPACES_ROUTE);
    await user.click(await screen.findByRole('button', { name: akMT('approve') }));

    expect(await screen.findByText(akMT('namespaceApproved'))).toBeInTheDocument();
  });

  it('asks before rejecting, since rejecting removes the namespace', async () => {
    const user = userEvent.setup();

    mockOrganizationMe({ is_owner: true, is_admin: true });
    withNamespaces([buildOrganizationNamespace({ is_approved: false })]);

    await renderAtRoute(NAMESPACES_ROUTE);
    await user.click(await screen.findByRole('button', { name: akMT('reject') }));

    expect(await screen.findByText(akMT('confirmBox.rejectNamespace'))).toBeInTheDocument();
  });

  it('leaves the namespace alone when the rejection is called off', async () => {
    const user = userEvent.setup();

    mockOrganizationMe({ is_owner: true, is_admin: true });
    withNamespaces([buildOrganizationNamespace({ is_approved: false })]);

    await renderAtRoute(NAMESPACES_ROUTE);
    await user.click(await screen.findByRole('button', { name: akMT('reject') }));

    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: akMT('cancel') }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('says so once a namespace is rejected', async () => {
    const user = userEvent.setup();

    mockOrganizationMe({ is_owner: true, is_admin: true });
    withNamespaces([buildOrganizationNamespace({ is_approved: false })]);

    server.use(
      http.delete('*/api/organizations/:organizationId/namespaces/:namespaceId', () =>
        HttpResponse.json({})
      )
    );

    await renderAtRoute(NAMESPACES_ROUTE);
    await user.click(await screen.findByRole('button', { name: akMT('reject') }));

    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: akMT('ok') }));

    expect(await screen.findByText(akMT('namespaceRejected'))).toBeInTheDocument();
  });

  it('shows when an approved namespace was approved, and by whom', async () => {
    mockOrganizationMe({ is_owner: true, is_admin: true });

    withNamespaces([
      buildOrganizationNamespace({
        is_approved: true,
        approved_on: new Date().toISOString(),
        approved_by: 1,
      }),
    ]);

    await renderAtRoute(NAMESPACES_ROUTE);

    /* Both who asked for it and who approved it are named, and both are this member. */
    await waitFor(() => expect(screen.getAllByText('alice')).toHaveLength(2));

    expect(screen.queryByRole('button', { name: akMT('approve') })).not.toBeInTheDocument();
  });

  it('names no one where the record names no one', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: false });
    withNamespaces([buildOrganizationNamespace({ requested_by: null })]);

    await renderAtRoute(NAMESPACES_ROUTE);

    await screen.findByRole('table');

    expect(screen.queryByText('alice')).not.toBeInTheDocument();
  });

  it.each([
    ['an iOS namespace', ENUMS.PLATFORM.IOS],
    ['a Windows namespace', ENUMS.PLATFORM.WINDOWS],
    ['a namespace on no known platform', 99],
  ])('lists %s', async (_description, platform) => {
    mockOrganizationMe({ is_owner: false, is_admin: false });
    withNamespaces([buildOrganizationNamespace({ value: 'com.example.app', platform })]);

    await renderAtRoute(NAMESPACES_ROUTE);

    expect(await screen.findByText('com.example.app')).toBeInTheDocument();
  });

  it('says what went wrong when an approval is refused', async () => {
    const user = userEvent.setup();

    mockOrganizationMe({ is_owner: true, is_admin: true });
    withNamespaces([buildOrganizationNamespace({ is_approved: false })]);

    server.use(
      http.put('*/api/organizations/:organizationId/namespaces/:namespaceId', () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute(NAMESPACES_ROUTE);
    await user.click(await screen.findByRole('button', { name: akMT('approve') }));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('says what went wrong when a rejection is refused', async () => {
    const user = userEvent.setup();

    mockOrganizationMe({ is_owner: true, is_admin: true });
    withNamespaces([buildOrganizationNamespace({ is_approved: false })]);

    server.use(
      http.delete('*/api/organizations/:organizationId/namespaces/:namespaceId', () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute(NAMESPACES_ROUTE);
    await user.click(await screen.findByRole('button', { name: akMT('reject') }));

    const dialog = await screen.findByRole('dialog');

    await user.click(within(dialog).getByRole('button', { name: akMT('ok') }));

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('asks for the next page', async () => {
    const user = userEvent.setup();

    mockOrganizationMe({ is_owner: false, is_admin: false });
    withNamespaces([buildOrganizationNamespace()], 42);

    await renderAtRoute(NAMESPACES_ROUTE);
    await user.click(await screen.findByRole('button', { name: akMT('next') }));

    expect(await screen.findByText(/11-/)).toBeInTheDocument();
  });

  it('closes the rejection question when dismissed with the keyboard', async () => {
    const user = userEvent.setup();

    mockOrganizationMe({ is_owner: true, is_admin: true });
    withNamespaces([buildOrganizationNamespace({ is_approved: false })]);

    await renderAtRoute(NAMESPACES_ROUTE);
    await user.click(await screen.findByRole('button', { name: akMT('reject') }));

    await screen.findByRole('dialog');
    await user.keyboard('{Escape}');

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('falls back to the empty state when the namespaces cannot be read', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: false });

    server.use(
      http.get(`*/${OrganizationEndpoints.namespaces('*')}`, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute(NAMESPACES_ROUTE);

    expect(await screen.findByText(akMT('noNamespaceRequested'))).toBeInTheDocument();
  });

  it('pages through the namespaces', async () => {
    mockOrganizationMe({ is_owner: false, is_admin: false });
    withNamespaces([buildOrganizationNamespace()], 42);

    await renderAtRoute(NAMESPACES_ROUTE);

    expect(await screen.findByText(/of 42/)).toBeInTheDocument();
  });
});

describe('the page in the address', () => {
  beforeEach(() => {
    clearStoredSession();
    storeSession(buildSession());
    withMember('alice');
    mockOrganizationMe({ is_owner: false, is_admin: false });
  });

  it('opens the page the address names', async () => {
    withNamespaces([buildOrganizationNamespace()], 42);

    /* The address names the page, as a shared link or a reload would. */
    await renderAtRoute(`${NAMESPACES_ROUTE}?namespace_limit=10&namespace_offset=20`);

    expect(await screen.findByText(/21-30 of 42/)).toBeInTheDocument();
  });

  it('writes the page it moves to, so the link still works after a reload', async () => {
    const user = userEvent.setup();

    withNamespaces([buildOrganizationNamespace()], 42);

    const { router } = await renderAtRoute(NAMESPACES_ROUTE);

    await user.click(await screen.findByRole('button', { name: akMT('next') }));

    await waitFor(() =>
      expect(router.state.location.search).toMatchObject({ namespace_offset: 10 })
    );
  });

  it('opens the first page where the address names none', async () => {
    withNamespaces([buildOrganizationNamespace()], 42);

    await renderAtRoute(NAMESPACES_ROUTE);

    expect(await screen.findByText(/1-10 of 42/)).toBeInTheDocument();
  });
});

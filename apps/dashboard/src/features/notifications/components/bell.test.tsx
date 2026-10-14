import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it } from 'vitest';

import { NotificationEndpoints } from '@irene/api/services/notification/endpoints';
import { UserEndpoints } from '@irene/api/services/user/endpoints';
import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';
import type { ApiNotification } from '@irene/api/services/notification';

import {
  buildNfSastcmpltd1Context,
  buildNfSkSubexpContext,
  buildNotification,
  buildSession,
  buildUser,
  buildUserResponse,
} from '@tests/factories';

import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { server } from '@tests/server';

const session = buildSession();
const user = buildUser();

const openProjects = () => renderAtRoute('/dashboard/projects');

/** Answers the unread list with `notifications`, and its count with their number. */
const mockUnreadNotifications = (notifications: ApiNotification[]) =>
  server.use(
    http.get(`*/${NotificationEndpoints.list('appknox')}`, () =>
      HttpResponse.json({
        count: notifications.length,
        next: null,
        previous: null,
        results: notifications,
      })
    )
  );

/** Reports which product's notifications were asked for. */
const watchNotificationRequests = () => {
  const askedFor: string[] = [];

  server.use(
    http.get(`*/${NotificationEndpoints.list('appknox')}`, () => {
      askedFor.push('appknox');

      return HttpResponse.json({ count: 0, next: null, previous: null, results: [] });
    }),

    http.get(`*/${NotificationEndpoints.list('storeknox')}`, () => {
      askedFor.push('storeknox');

      return HttpResponse.json({ count: 0, next: null, previous: null, results: [] });
    })
  );

  return askedFor;
};

const openBell = async () => {
  await userEvent.click(await screen.findByRole('button', { name: akMT('notifications') }));
};

describe('NotificationsBell', () => {
  beforeEach(() => {
    storeSession(session);
    mockOrganizationFeatures({});

    server.use(
      http.get(`*/${UserEndpoints.detail(session.userId)}`, () =>
        HttpResponse.json(buildUserResponse(user))
      )
    );
  });

  it('marks the bell when something is unread', async () => {
    mockUnreadNotifications([buildNotification()]);

    await openProjects();

    await waitFor(() =>
      expect(document.querySelector('[data-test-notifications-unread-dot]')).toBeInTheDocument()
    );
  });

  it('leaves the bell unmarked when nothing is unread', async () => {
    mockUnreadNotifications([]);

    await openProjects();

    await screen.findByRole('button', { name: akMT('notifications') });

    expect(document.querySelector('[data-test-notifications-unread-dot]')).not.toBeInTheDocument();
  });

  it('states how many are unread in the panel the bell opens', async () => {
    mockUnreadNotifications([buildNotification(), buildNotification()]);

    await openProjects();
    await openBell();

    const panel = await screen.findByRole('dialog');

    expect(within(panel).getByText('2')).toBeInTheDocument();
  });

  it('renders each notification message from its code and context', async () => {
    mockUnreadNotifications([
      buildNotification({
        message_code: 'NF_SK_SUBEXP',
        context: buildNfSkSubexpContext({ is_trial: false }),
      }),
    ]);

    await openProjects();
    await openBell();

    expect(await screen.findByText(/expire on/)).toBeInTheDocument();
  });

  it('renders the trial wording when the notification context says it is a trial', async () => {
    mockUnreadNotifications([
      buildNotification({
        message_code: 'NF_SK_SUBEXP',
        context: buildNfSkSubexpContext({ is_trial: true }),
      }),
    ]);

    await openProjects();
    await openBell();

    expect(await screen.findByText(/trial subscription/)).toBeInTheDocument();
  });

  it('renders a scan notification with its risk counts and its file link', async () => {
    mockUnreadNotifications([
      buildNotification({
        message_code: 'NF_SASTCMPLTD1',
        context: buildNfSastcmpltd1Context({
          file_id: 186506,
          version: '9.0.16',
          version_code: '9016',
          untested_count: 44,
        }),
      }),
    ]);

    await openProjects();
    await openBell();

    expect(await screen.findByText(/Static scan completed/)).toBeInTheDocument();

    expect(document.querySelector('[data-test-notification-version]')).toHaveTextContent(
      'version: 9.0.16 | version code: 9016'
    );

    expect(screen.getByText(akMT('notificationModule.riskStatus'))).toBeInTheDocument();
    expect(screen.getByText('44')).toBeInTheDocument();

    expect(screen.getByRole('link', { name: `${akMT('viewFile')}: 186506` })).toHaveAttribute(
      'href',
      '/dashboard/file/186506'
    );
  });

  it('states the code when a context is missing the values its message renders', async () => {
    mockUnreadNotifications([
      buildNotification({
        message_code: 'NF_UPLDFAILPAYRQ1',
        context: {},
      }),
    ]);

    await openProjects();
    await openBell();

    await waitFor(() => expect(document.body).toHaveTextContent('NF_UPLDFAILPAYRQ1'));
  });

  it('states the code for a notification this build does not recognise', async () => {
    mockUnreadNotifications([buildNotification({ message_code: 'NF_NOT_A_CODE' })]);

    await openProjects();
    await openBell();

    expect(await screen.findByText(/NF_NOT_A_CODE/)).toBeInTheDocument();
  });

  it('says so when there is nothing unread', async () => {
    mockUnreadNotifications([]);

    await openProjects();
    await openBell();

    expect(
      await screen.findByText(akMT('notificationModule.noUnreadNotifications'))
    ).toBeInTheDocument();
  });

  it('clears the list when every notification is marked read', async () => {
    let markedAll = false;

    mockUnreadNotifications([buildNotification()]);

    server.use(
      http.post(`*/${NotificationEndpoints.markAllAsRead('appknox')}`, () => {
        markedAll = true;

        return new HttpResponse(null, { status: 204 });
      })
    );

    await openProjects();
    await openBell();

    await userEvent.click(
      await screen.findByRole('button', { name: akMT('notificationModule.markAllAsRead') })
    );

    await waitFor(() => expect(markedAll).toBe(true));
  });

  it('leaves a notification on the list once it is marked read', async () => {
    const notification = buildNotification();

    mockUnreadNotifications([notification]);

    server.use(
      http.patch(`*/${NotificationEndpoints.detail('appknox', notification.id)}`, () =>
        HttpResponse.json({ ...notification, has_read: true })
      )
    );

    await openProjects();
    await openBell();

    const toggle = await screen.findByRole('checkbox', { name: notification.message_code });

    await userEvent.click(toggle);
    await waitFor(() => expect(toggle).not.toBeChecked());

    expect(screen.getByRole('checkbox', { name: notification.message_code })).toBeInTheDocument();
  });

  it('flips the dot before the server answers', async () => {
    const notification = buildNotification();

    mockUnreadNotifications([notification]);

    /* The request never settles, so only the optimistic update can flip it. */
    server.use(
      http.patch(
        `*/${NotificationEndpoints.detail('appknox', notification.id)}`,
        () => new Promise(() => undefined)
      )
    );

    await openProjects();
    await openBell();

    const toggle = await screen.findByRole('checkbox', { name: notification.message_code });

    expect(toggle).toBeChecked();

    await userEvent.click(toggle);

    expect(toggle).not.toBeChecked();
  });

  it('puts the dot back when the request fails', async () => {
    const notification = buildNotification();

    mockUnreadNotifications([notification]);

    server.use(
      http.patch(`*/${NotificationEndpoints.detail('appknox', notification.id)}`, () =>
        HttpResponse.json({ detail: 'Server error.' }, { status: 500 })
      )
    );

    await openProjects();
    await openBell();

    const toggle = await screen.findByRole('checkbox', { name: notification.message_code });

    await userEvent.click(toggle);
    await waitFor(() => expect(toggle).toBeChecked());
  });

  it('marks one notification read from its checkbox', async () => {
    const notification = buildNotification();

    let patchedId = 0;

    mockUnreadNotifications([notification]);

    server.use(
      http.patch(`*/${NotificationEndpoints.detail('appknox', notification.id)}`, () => {
        patchedId = notification.id;

        return HttpResponse.json({ ...notification, has_read: true });
      })
    );

    await openProjects();
    await openBell();

    await userEvent.click(await screen.findByRole('checkbox', { name: notification.message_code }));
    await waitFor(() => expect(patchedId).toBe(notification.id));
  });

  it('opens the notifications page from the panel', async () => {
    mockUnreadNotifications([]);

    const { router } = await openProjects();

    await openBell();

    await userEvent.click(
      await screen.findByRole('link', { name: akMT('notificationModule.viewAllNotifications') })
    );

    await waitFor(() => expect(router.state.location.pathname).toBe('/dashboard/notifications'));
  });
});

describe('NotificationsBell across products', () => {
  beforeEach(() => {
    storeSession(session);
    mockOrganizationFeatures({ storeknox: true });
  });

  it('asks for the notifications of the product the page belongs to', async () => {
    const askedFor = watchNotificationRequests();

    renderAtRoute('/dashboard/storeknox/inventory/app-list');

    await screen.findByRole('button', { name: akMT('notifications') });

    await waitFor(() => expect(askedFor).toContain('storeknox'));

    expect(askedFor).not.toContain('appknox');
  });

  it('asks Appknox for them on a VAPT page', async () => {
    const askedFor = watchNotificationRequests();

    openProjects();

    await screen.findByRole('button', { name: akMT('notifications') });

    await waitFor(() => expect(askedFor).toContain('appknox'));

    expect(askedFor).not.toContain('storeknox');
  });
});

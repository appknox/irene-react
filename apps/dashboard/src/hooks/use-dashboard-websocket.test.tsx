import { screen, waitFor } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { queryClient } from '@irene/api/query-client';
import { NotificationEndpoints } from '@irene/api/services/notification/endpoints';
import { UserEndpoints } from '@irene/api/services/user/endpoints';
import { storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';
import { akNotify } from '@irene/ui/notify';
import { WEBSOCKET_EVENTS, WEBSOCKET_NOTIFY_TYPE } from '@irene/websocket/testing';

import { notificationKeys } from '@/features/notifications/queries/notification';
import { buildSession, buildUser, buildUserResponse } from '@tests/factories';
import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute } from '@tests/render';
import { server } from '@tests/server';
import { websocketTransport } from '@tests/setup';

const session = buildSession();

/**
 * Opens a signed-in page and waits for the connection it makes.
 *
 * @param socketId - The room the account's events are published to.
 * @returns The room the connection was opened for, if one was.
 */
const openSignedInPage = async (socketId: string | null) => {
  server.use(
    http.get(`*/${UserEndpoints.detail(session.userId)}`, () =>
      HttpResponse.json(buildUserResponse(buildUser({ id: session.userId, socket_id: socketId })))
    )
  );

  renderAtRoute('/dashboard/projects');

  await screen.findByRole('button', { name: akMT('notifications') });

  return websocketTransport.room;
};

/** Plays an event through the handlers the hook registered, as the server would. */
const serverSends = (event: string, payload: unknown) => {
  websocketTransport.emit(event, payload);
};

describe('useDashboardWebsocket', () => {
  beforeEach(() => {
    storeSession(session);
    mockOrganizationFeatures({});

    server.use(
      http.get(`*/${NotificationEndpoints.list('appknox')}`, () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [] })
      )
    );
  });

  it('opens the room the account names', async () => {
    await expect(openSignedInPage('a-room')).resolves.toBe('a-room');
  });

  it('opens nothing for an account the server gave no room', async () => {
    await expect(openSignedInPage(null)).resolves.toBeUndefined();
  });

  it('writes an unread count the server reports straight onto the bell', async () => {
    await openSignedInPage('a-room');

    await waitFor(() =>
      expect(queryClient.getQueryData(notificationKeys.unread('appknox'))).toMatchObject({
        count: 1,
      })
    );

    serverSends(WEBSOCKET_EVENTS.notification, { unread_count: 12, product: 0 });

    expect(queryClient.getQueryData(notificationKeys.unread('appknox'))).toMatchObject({
      count: 12,
    });
  });

  it('shows a message the server sends as a toast', async () => {
    const success = vi.spyOn(akNotify, 'success');

    await openSignedInPage('a-room');

    serverSends(WEBSOCKET_EVENTS.message, {
      message: 'A scan finished',
      notifyType: WEBSOCKET_NOTIFY_TYPE.success,
    });

    expect(success).toHaveBeenCalledWith('A scan finished', {});
  });
});

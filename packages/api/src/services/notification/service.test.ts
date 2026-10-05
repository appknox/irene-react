import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { server } from '@tests/server';

import { NotificationEndpoints } from './endpoints';
import NotificationService from './service';
import type { ApiNotification } from './types';

const notification: ApiNotification = {
  id: 7,
  has_read: false,
  message_code: 'NF_SASTCMPLTD1',
  context: { file_id: 12 },
  created_on: '2026-09-29T10:00:00Z',
};

describe('NotificationService', () => {
  it('returns the page of notifications and the total count', async () => {
    server.use(
      http.get(`*/${NotificationEndpoints.list('appknox')}`, () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [notification] })
      )
    );

    await expect(
      NotificationService.getNotifications('appknox', { limit: 7, offset: 0, has_read: false })
    ).resolves.toMatchObject({ items: [notification], count: 1, hasNext: false });
  });

  it('narrows the list to unread notifications when asked to', async () => {
    let requestedUrl = '';

    server.use(
      http.get(`*/${NotificationEndpoints.list('appknox')}`, ({ request }) => {
        requestedUrl = request.url;

        return HttpResponse.json({ count: 0, next: null, previous: null, results: [] });
      })
    );

    await NotificationService.getNotifications('appknox', { limit: 7, offset: 0, has_read: false });

    expect(requestedUrl).toContain('has_read=false');
    expect(requestedUrl).toContain('limit=7');
  });

  it('marks one notification read', async () => {
    server.use(
      http.patch(`*/${NotificationEndpoints.detail('appknox', 7)}`, async ({ request }) => {
        const body = await request.json();

        return HttpResponse.json({ ...notification, ...(body as object) });
      })
    );

    await expect(
      NotificationService.setNotificationRead('appknox', 7, true)
    ).resolves.toMatchObject({
      has_read: true,
    });
  });

  it('marks every notification read', async () => {
    server.use(
      http.post(
        `*/${NotificationEndpoints.markAllAsRead('appknox')}`,
        () => new HttpResponse(null, { status: 204 })
      )
    );

    await expect(NotificationService.markAllAsRead('appknox')).resolves.not.toThrow();
  });
});

describe('NotificationService across products', () => {
  it('reads store monitoring notifications from their own path', async () => {
    server.use(
      http.get(`*/${NotificationEndpoints.list('storeknox')}`, () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [notification] })
      )
    );

    await expect(
      NotificationService.getNotifications('storeknox', { limit: 7, offset: 0, has_read: false })
    ).resolves.toMatchObject({ count: 1, items: [{ id: notification.id }] });
  });

  it('names a different path for each product', () => {
    expect(NotificationEndpoints.list('appknox')).not.toBe(NotificationEndpoints.list('storeknox'));
  });
});

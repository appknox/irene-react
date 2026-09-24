import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { UserEndpoints, UserService } from '@irene/api/services/user';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { buildUser, buildUserResponse } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

const USER_ID = 42;
const detailUrl = (id: number | string) => buildAPITestURL(UserEndpoints.detail(id));

describe('UserService.getUser', () => {
  it('returns the account fields', async () => {
    const user = buildUser({ lang: 'ja' });

    server.use(http.get(detailUrl(USER_ID), () => HttpResponse.json(buildUserResponse(user))));

    await expect(UserService.getUser(USER_ID)).resolves.toEqual(user);
  });

  it('gets the user endpoint for the id it was given', async () => {
    let asked = '';

    server.use(
      http.get(detailUrl(USER_ID), ({ request }) => {
        asked = new URL(request.url).pathname;

        return HttpResponse.json(buildUserResponse());
      })
    );

    await UserService.getUser(USER_ID);

    expect(asked).toContain(`/users/${USER_ID}`);
  });

  it('encodes an id that would otherwise change the path', async () => {
    expect(UserEndpoints.detail('4/2')).toBe('api/users/4%2F2');
  });

  it('rejects when the request is refused', async () => {
    server.use(
      http.get(detailUrl(USER_ID), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.FORBIDDEN })
      )
    );

    const error = await UserService.getUser(USER_ID).catch((reason: unknown) => reason);

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.FORBIDDEN);
  });
});

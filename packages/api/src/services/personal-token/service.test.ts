import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import { PersonalTokenEndpoints, PersonalTokenService } from '@irene/api/services/personal-token';
import { buildPersonalToken, toPersonalTokenResource } from '@tests/factories';
import { buildAPITestURL, server } from '@tests/server';

const LIST_URL = buildAPITestURL(PersonalTokenEndpoints.list());

describe('PersonalTokenService.getPersonalTokens', () => {
  it('asks for the first ten and returns them out of their envelopes', async () => {
    const tokens = [buildPersonalToken(), buildPersonalToken()];
    let query: URLSearchParams | undefined;

    server.use(
      http.get(LIST_URL, ({ request }) => {
        query = new URL(request.url).searchParams;

        return HttpResponse.json({ data: tokens.map(toPersonalTokenResource) });
      })
    );

    await expect(PersonalTokenService.getPersonalTokens()).resolves.toEqual(tokens);
    expect(query?.get('limit')).toBe('10');
    expect(query?.get('offset')).toBe('0');
  });
});

describe('PersonalTokenService.createPersonalToken', () => {
  it('posts the name and returns the new token', async () => {
    const token = buildPersonalToken();
    let body: unknown;

    server.use(
      http.post(LIST_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({ data: toPersonalTokenResource(token) });
      })
    );

    await expect(PersonalTokenService.createPersonalToken(token.name)).resolves.toEqual(token);
    expect(body).toEqual({ name: token.name });
  });
});

describe('PersonalTokenService.revokePersonalToken', () => {
  it('deletes the token by its id', async () => {
    const token = buildPersonalToken();
    let wasDeleted = false;

    server.use(
      http.delete(buildAPITestURL(PersonalTokenEndpoints.detail(token.id)), () => {
        wasDeleted = true;

        return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
      })
    );

    await PersonalTokenService.revokePersonalToken(token.id);

    expect(wasDeleted).toBe(true);
  });
});

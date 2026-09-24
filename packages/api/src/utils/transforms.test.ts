import { describe, expect, it } from 'vitest';

import {
  transformPaginatedResponse,
  transformUserResponse,
  transformVulnerabilityListResponse,
} from '@irene/api/utils/transforms';

import {
  buildUser,
  buildUserResponse,
  buildVulnerability,
  buildVulnerabilityListResponse,
} from '@tests/factories';

import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

/** A list response as the server sends it. */
const respondWith = (overrides = {}) => ({
  count: 2,
  next: 'https://api.example.test/api/v3/projects?limit=1&offset=1',
  previous: null,
  results: [{ id: 1 }, { id: 2 }],
  ...overrides,
});

describe('transformPaginatedResponse', () => {
  it('renames results to items', () => {
    expect(transformPaginatedResponse(respondWith()).items).toEqual([{ id: 1 }, { id: 2 }]);
  });

  it('keeps count as the total across pages, not the rows on this one', () => {
    expect(transformPaginatedResponse(respondWith({ count: 97 })).count).toBe(97);
  });

  it('reports hasNext and hasPrevious from the next and previous URLs', () => {
    const page = transformPaginatedResponse(respondWith());

    expect(page.hasNext).toBe(true);
    expect(page.hasPrevious).toBe(false);
  });

  it('keeps the next and previous URLs', () => {
    const response = respondWith({ previous: 'https://api.example.test/prev' });
    const page = transformPaginatedResponse(response);

    expect(page.nextUrl).toBe(response.next);
    expect(page.previousUrl).toBe(response.previous);
  });

  it('reports hasNext false on the last page', () => {
    const page = transformPaginatedResponse(respondWith({ next: null }));

    expect(page.hasNext).toBe(false);
    expect(page.nextUrl).toBeNull();
  });

  it('returns an empty items list when the body carries no results', () => {
    // The server has answered a list with no `results` key, which the types do not admit.
    const bodyWithoutRows: ApiPageEnvelope<{ id: number }> = {
      count: 0,
      next: null,
      previous: null,
      ...({} as { results: { id: number }[] }),
    };

    const page = transformPaginatedResponse(bodyWithoutRows);

    expect(page.items).toEqual([]);
    expect(page.count).toBe(0);
  });
});

describe('transformUserResponse', () => {
  it('renames the kebab-case attributes to snake_case fields', () => {
    const user = buildUser({ first_name: 'Ada', last_name: 'Lovelace', lang: 'ja' });

    expect(transformUserResponse(buildUserResponse(user))).toEqual(user);
  });

  it('reads an omitted attribute as null', () => {
    const { data } = buildUserResponse();

    const withheld = {
      data: {
        ...data,
        attributes: {
          uuid: data.attributes.uuid,
          username: data.attributes.username,
          'first-name': data.attributes['first-name'],
          'last-name': data.attributes['last-name'],
          lang: data.attributes.lang,
        },
      },
    };

    expect(transformUserResponse(withheld)).toMatchObject({
      email: null,
      mfa_method: null,
      freshchat_hash: null,
      is_trial: false,
      can_disable_mfa: false,
    });
  });
});

describe('transformVulnerabilityListResponse', () => {
  it('returns every entry without the envelope', () => {
    const vulnerability = buildVulnerability({ name: 'Insecure storage' });

    expect(
      transformVulnerabilityListResponse(buildVulnerabilityListResponse([vulnerability]))
    ).toEqual([vulnerability]);
  });

  it('returns an empty list for a response with no entries', () => {
    expect(transformVulnerabilityListResponse({ data: [] })).toEqual([]);
  });
});

import type { ApiUser, ApiUserResponse } from '@irene/api/services/user';
import type { ApiPage, ApiPageEnvelope } from '@irene/api/utils/pagination';

import type {
  ApiVulnerability,
  ApiVulnerabilityListResponse,
} from '@irene/api/services/vulnerability';

/**
 * Turns the server's list wrapper into the page shape the app reads. Every list
 * endpoint answers the same wrapper, so no service should be interpreting it for
 * itself.
 *
 * @param response - The list response exactly as the server sent it.
 * @returns The rows, the total, whether there is more either side, and the server's own page links.
 */
export const transformPaginatedResponse = <T>(response: ApiPageEnvelope<T>): ApiPage<T> => ({
  items: response.results ?? [],
  count: response.count ?? 0,
  hasNext: Boolean(response.next),
  hasPrevious: Boolean(response.previous),
  nextUrl: response.next ?? null,
  previousUrl: response.previous ?? null,
});

/**
 * Takes the envelope off the account, and names the attributes the way the rest
 * of the API names its fields. A field the server withheld reads as nothing
 * rather than as an empty value.
 *
 * @param response - The account response exactly as the server sent it.
 * @returns The account.
 */
export function transformUserResponse({ data }: ApiUserResponse): ApiUser {
  const { id, attributes } = data;

  return {
    id,
    uuid: attributes.uuid,
    username: attributes.username,
    first_name: attributes['first-name'],
    last_name: attributes['last-name'],
    lang: attributes.lang,
    email: attributes.email ?? null,
    mfa_method: attributes['mfa-method'] ?? null,
    is_trial: Boolean(attributes['is-trial']),
    can_disable_mfa: Boolean(attributes['can-disable-mfa']),
    freshchat_hash: attributes['freshchat-hash'] ?? null,
  };
}

/**
 * Takes the envelope off the vulnerability catalogue, and names the attributes
 * the way the rest of the API names its fields.
 *
 * @param response - The catalogue response exactly as the server sent it.
 * @returns The vulnerabilities.
 */
export function transformVulnerabilityListResponse(
  response: ApiVulnerabilityListResponse
): ApiVulnerability[] {
  return (response.data ?? []).map(({ id, attributes }) => ({
    id,
    uuid: attributes.uuid,
    name: attributes.name,
    description: attributes.description,
    question: attributes.question,
    success_message: attributes['success-message'],
    business_implication: attributes['business-implication'],
    intro: attributes.intro,
    compliant: attributes.compliant,
    non_compliant: attributes['non-compliant'],
    related_to: attributes['related-to'],
    types: attributes.types,
    is_active: attributes['is-active'],
  }));
}

import { API_NAMESPACES } from '@irene/api/namespaces';

/** `organizations/<id>`, which every billing path sits under. */
const organization = (organizationId: number | string) =>
  `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}` as const;

/** Paths for an organization's plans, subscription, invoices and enterprise license. */
export const BillingEndpoints = {
  /** The plans the organization can subscribe to. */
  plans: (organizationId: number | string) => `${organization(organizationId)}/plans` as const,

  /** The organization's subscriptions (GET). */
  subscriptions: (organizationId: number | string) =>
    `${organization(organizationId)}/subscriptions` as const,

  /** One subscription, which a DELETE cancels at the end of its term. */
  subscription: (organizationId: number | string, subscriptionId: string) =>
    `${organization(organizationId)}/subscriptions/${encodeURIComponent(subscriptionId)}` as const,

  /** The organization's invoices. */
  invoices: (organizationId: number | string) =>
    `${organization(organizationId)}/invoices` as const,

  /** The subscription term and license counts an owner is shown on the subscription page. */
  subscriptionInfo: (organizationId: number | string) =>
    `${organization(organizationId)}/subscription-info` as const,

  /** The enterprise license, on a deployment that has one. */
  license: (organizationId: number | string) => `${organization(organizationId)}/license` as const,
};

import { apiRequest, REQUEST_ABORT_TIMEOUT_MS } from '@irene/api/request';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';
import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

import type {
  ApiInvoice,
  ApiInvoiceDownload,
  ApiLicense,
  ApiPlan,
  ApiSubscription,
} from '@irene/api/services/billing';

import { BillingEndpoints } from './endpoints';

/**
 * Fetches the first page of a billing list, which is all irene shows.
 *
 * @param path - The list to fetch.
 * @returns Its rows.
 */
const _getFirstPage = async <T>(path: string) => {
  const page = await apiRequest.get<ApiPageEnvelope<T>>(path, {
    signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS),
  });

  return transformPaginatedResponse(page).items;
};

/**
 * Talks to the endpoints behind an organization's billing: its plans,
 * subscription, invoices and, on a self-hosted deployment, its license.
 * Every one of them is the owner's alone.
 */
export default class BillingService {
  /**
   * Fetches the plans the organization can subscribe to.
   *
   * @param organizationId - The organization.
   * @returns The plans it can subscribe to.
   */
  public static readonly getPlans = (organizationId: number | string) =>
    _getFirstPage<ApiPlan>(BillingEndpoints.plans(organizationId));

  /**
   * Fetches the organization's subscriptions.
   *
   * @param organizationId - The organization.
   * @returns Its subscriptions; the first is the one the page shows.
   */
  public static readonly getSubscriptions = (organizationId: number | string) =>
    _getFirstPage<ApiSubscription>(BillingEndpoints.subscriptions(organizationId));

  /**
   * Cancels a subscription at the end of the term it is in.
   *
   * @param organizationId - The organization.
   * @param subscriptionId - The subscription.
   * @returns Resolves once it is cancelled.
   */
  public static readonly cancelSubscription = (
    organizationId: number | string,
    subscriptionId: string
  ) => apiRequest.delete<void>(BillingEndpoints.subscription(organizationId, subscriptionId));

  /**
   * Fetches the organization's invoices.
   *
   * @param organizationId - The organization.
   * @returns Its invoices.
   */
  public static readonly getInvoices = (organizationId: number | string) =>
    _getFirstPage<ApiInvoice>(BillingEndpoints.invoices(organizationId));

  /**
   * Asks for a link to an invoice's PDF.
   *
   * @param downloadPath - The invoice's `download_url`, an API path.
   * @returns The link, which expires shortly after it is issued.
   */
  public static readonly getInvoiceDownload = (downloadPath: string) =>
    apiRequest.get<ApiInvoiceDownload>(downloadPath.replace(/^\/+/, ''));

  /**
   * Fetches the enterprise license. The server answers 404 where there is none
   * to show: not a self-hosted deployment, or billing hidden for it.
   *
   * @param organizationId - The organization.
   * @returns The license.
   */
  public static readonly getLicense = (organizationId: number | string) =>
    apiRequest.get<ApiLicense>(BillingEndpoints.license(organizationId), {
      signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS),
    });
}

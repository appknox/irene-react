import { queryOptions } from '@tanstack/react-query';
import { BillingService } from '@irene/api/services/billing';

/** The cache keys for an organization's billing. */
export const billingKeys = {
  all: (organizationId: string) => ['billing', organizationId] as const,
  plans: (organizationId: string) => [...billingKeys.all(organizationId), 'plans'] as const,
  subscriptions: (organizationId: string) =>
    [...billingKeys.all(organizationId), 'subscriptions'] as const,
  invoices: (organizationId: string) => [...billingKeys.all(organizationId), 'invoices'] as const,
  license: (organizationId: string) => [...billingKeys.all(organizationId), 'license'] as const,
  subscriptionInfo: (organizationId: string) =>
    [...billingKeys.all(organizationId), 'subscription-info'] as const,
};

/**
 * Builds the query for the plans an organization can subscribe to.
 *
 * @param organizationId - The organization.
 * @returns Query options resolving to the plans.
 */
export const plansOptions = (organizationId: string) =>
  queryOptions({
    queryKey: billingKeys.plans(organizationId),
    queryFn: () => BillingService.getPlans(organizationId),
  });

/**
 * Builds the query for an organization's subscriptions.
 *
 * @param organizationId - The organization.
 * @returns Query options resolving to the subscriptions.
 */
export const subscriptionsOptions = (organizationId: string) =>
  queryOptions({
    queryKey: billingKeys.subscriptions(organizationId),
    queryFn: () => BillingService.getSubscriptions(organizationId),
  });

/**
 * Builds the query for an organization's invoices.
 *
 * @param organizationId - The organization.
 * @returns Query options resolving to the invoices.
 */
export const invoicesOptions = (organizationId: string) =>
  queryOptions({
    queryKey: billingKeys.invoices(organizationId),
    queryFn: () => BillingService.getInvoices(organizationId),
  });

/**
 * Builds the query for the enterprise license.
 *
 * Any refusal reads as "no license": irene shows the subscription view in its
 * place whatever went wrong, and the usual one is the 404 a deployment without
 * a license gets, which asking again will not change.
 *
 * @param organizationId - The organization.
 * @returns Query options resolving to the license, or null where there is none.
 */
export const licenseOptions = (organizationId: string) =>
  queryOptions({
    queryKey: billingKeys.license(organizationId),
    queryFn: () => BillingService.getLicense(organizationId).catch(() => null),
  });

/**
 * Builds the query for the subscription term and license counts.
 *
 * Any refusal reads as "nothing to show", as irene's route reads it: the usual
 * one is the 404 an organization that does not show its subscription gets.
 *
 * @param organizationId - The organization.
 * @returns Query options resolving to the term and counts, or null where there are none.
 */
export const subscriptionInfoOptions = (organizationId: string) =>
  queryOptions({
    queryKey: billingKeys.subscriptionInfo(organizationId),
    queryFn: () => BillingService.getSubscriptionInfo(organizationId).catch(() => null),
  });

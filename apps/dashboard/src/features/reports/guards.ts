import type { QueryClient } from '@tanstack/react-query';
import { redirect } from '@tanstack/react-router';

import { organizationStore } from '@irene/api/stores/organization';

import { setupUserAndOrgContext } from '@/actions/setup-user-context';

/**
 * Sends an account whose organization has saved reports switched off to the
 * page that generates a report, since every saved-report call would be refused.
 *
 * The organization context is awaited here rather than left to the parent's
 * loader, which runs after the guards; the queries behind it are cached.
 *
 * @param queryClient - The app's query client.
 * @param userId - The signed-in account.
 */
export async function requireSavedReports(queryClient: QueryClient, userId: number) {
  await setupUserAndOrgContext(queryClient, userId);

  if (!hasSavedReports()) {
    throw redirect({ to: '/dashboard/reports/generate', replace: true });
  }
}

/**
 * Whether the organization may keep reports: AI reporting on, and saved reports on with it.
 *
 * @returns Whether saved reports are open to the account.
 */
export function hasSavedReports() {
  const aiFeatures = organizationStore.getState().aiFeatures();

  return aiFeatures.reporting && aiFeatures.saved_reports;
}

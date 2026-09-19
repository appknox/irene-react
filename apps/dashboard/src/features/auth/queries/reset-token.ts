import { queryOptions } from '@tanstack/react-query';

import { AuthService } from '@irene/api/services/auth';
import { authKeys } from '@/features/auth/queries/keys';

/**
 * Builds the query that checks a password reset link before the form is
 * offered, so a spent link says so rather than failing after the user types.
 *
 * @param token - The token from the emailed link.
 * @returns Query options resolving to the account the link belongs to, rejecting when it is spent.
 */
export const resetTokenOptions = (token: string) =>
  queryOptions({
    queryKey: authKeys.resetToken(token),
    queryFn: () => AuthService.verifyResetToken(token),
    retry: false,
  });

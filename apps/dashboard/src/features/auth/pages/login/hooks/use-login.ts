import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';

import {
  AuthService,
  type ApiLoginRequest,
  type ApiMfaRequirement,
} from '@irene/api/services/auth';

import { akNotify } from '@irene/ui/notify';

import { startSession } from '@/features/auth/actions/session';
import { getLoginFailure } from '@/features/auth/utils/login-error';

/**
 * ============================================================
 * TYPES
 * ============================================================
 */
interface UseLoginOptions {
  onMfaRequired?: (mfaRequirement: ApiMfaRequirement) => void;
}

/**
 * Signs a user in and, on success, puts them in the dashboard with a session
 * the app can restore. Refusals the user can act on come back as `failure`;
 * everything else is raised as a toast, since no field explains it.
 *
 * @param options.onMfaRequired - Handles a second-factor mfaRequirement.
 * @returns The mutation, and how its refusal should be shown.
 */
export function useLogin({ onMfaRequired }: UseLoginOptions = {}) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const login = useMutation({
    mutationFn: (values: ApiLoginRequest) => AuthService.login(values),

    onSuccess: async (response) => {
      startSession(queryClient, response);
      await navigate({ to: '/' });
    },

    // Only a refused password and a locked account belong on the field itself.
    // MFA failures are handled by the caller.
    onError: (error) => {
      const failure = getLoginFailure(error);
      const isMfa = failure?.kind === 'mfa';
      const failureShouldBeNotified = failure?.kind === 'notify';

      if (isMfa) {
        onMfaRequired?.(failure.mfaRequirement);
      } else if (failureShouldBeNotified) {
        akNotify.error(failure.message);
      }
    },
  });

  return { login, failure: getLoginFailure(login.error) };
}

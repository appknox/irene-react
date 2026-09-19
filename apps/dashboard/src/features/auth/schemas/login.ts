import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import type { ApiMfaRequirement } from '@irene/api/services/auth';

/**
 * One form spans every step, so all three schemas describe the same fields and
 * differ only in what each step requires.
 *
 * @returns The first step: the username the SSO check runs against.
 */
export const buildUsernameSchema = () =>
  z.object({
    username: z.string().trim().min(1, akMT('usernameEmailIdTextPlaceholder')),
    password: z.string(),
    otp: z.string(),
  });

/**
 * The second step, once the check says this account signs in with a password.
 *
 * @returns The schema.
 */
export const buildLoginSchema = () =>
  buildUsernameSchema().extend({
    password: z.string().min(1, akMT('passwordPlaceholder')),
  });

/**
 * The third step, once the password was right but the account wants a second
 * factor as well.
 *
 * @returns The schema.
 */
export const buildMfaSchema = () =>
  buildLoginSchema().extend({
    otp: z.string().trim().min(1, akMT('enterCode')),
  });

/**
 * The validation each step needs: the username alone, then the password, then
 * the second factor once one has been asked for.
 */
export const resolveLoginSchema = (
  needsPassword: boolean,
  mfaRequirement: ApiMfaRequirement | null
) => {
  if (!mfaRequirement) {
    return needsPassword ? buildLoginSchema() : buildUsernameSchema();
  }

  return buildMfaSchema();
};

// The shape every step shares, since each step only tightens the same fields.
export type LoginFormSchema = z.infer<ReturnType<typeof buildUsernameSchema>>;

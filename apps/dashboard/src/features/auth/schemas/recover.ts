import { z } from 'zod';
import { akMT } from '@irene/translations/intl';

/**
 * The account to send a password reset link to. Built per render, so its
 * messages follow the active locale.
 *
 * @returns The schema.
 */
export const buildRecoverSchema = () =>
  z.object({
    username: z.string().trim().min(1, akMT('usernameEmailIdTextPlaceholder')),
  });

export type RecoverFormSchema = z.infer<ReturnType<typeof buildRecoverSchema>>;

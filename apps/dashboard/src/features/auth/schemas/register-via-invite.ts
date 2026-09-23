import { z } from 'zod';
import { akMT } from '@irene/translations/intl';

/** What the API accepts as a username, which it rejects anything else against. */
const USERNAME_MIN_LENGTH = 3;

/** The shortest password Django's own validators let through. */
const PASSWORD_MIN_LENGTH = 10;

/**
 * The account an invitation is redeemed for. Built per render, so its messages
 * follow the active locale.
 *
 * The address is not here: it comes from the invitation and cannot be changed.
 *
 * @returns The schema.
 */
export const buildRegisterViaInviteSchema = () =>
  z
    .object({
      company: z.string().trim().min(1, akMT('companyNameRequired')),
      firstName: z.string().trim(),
      lastName: z.string().trim(),
      username: z.string().trim().min(USERNAME_MIN_LENGTH, akMT('usernameMinLengthError')),
      password: z.string().min(PASSWORD_MIN_LENGTH, akMT('passwordMinLengthError')),
      confirmPassword: z.string().min(1, akMT('enterConfirmPassword')),
      termsAccepted: z.boolean().refine((accepted) => accepted, akMT('acceptTermsError')),
    })
    .refine((values) => values.password === values.confirmPassword, {
      message: akMT('passwordMatchError'),
      path: ['confirmPassword'],
    });

export type RegisterViaInviteFormSchema = z.infer<ReturnType<typeof buildRegisterViaInviteSchema>>;

import { z } from 'zod';
import { akMT } from '@irene/translations/intl';

/**
 * The details an account is opened with. Built per render, so its messages
 * follow the active locale.
 *
 * @returns The schema.
 */
export const buildRegisterSchema = () =>
  z.object({
    email: z.email(akMT('invalidEmailAddress')),
    company: z.string().trim().min(1, akMT('companyNameRequired')),
  });

export type RegisterFormSchema = z.infer<ReturnType<typeof buildRegisterSchema>>;

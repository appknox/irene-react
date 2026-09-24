import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { createAkFormField } from '@irene/ui/ak-form/helpers';

/** What every organization invitation asks for, whichever way the account signs in. */
const _accountSchema = () =>
  z.object({
    first_name: z.string().trim().min(1, akMT('firstNameRequired')),
    last_name: z.string().trim().min(1, akMT('lastNameRequired')),
    username: z.string().trim().min(3, akMT('usernameMinLengthError')),
    terms_accepted: z.boolean().refine((accepted) => accepted, akMT('acceptTermsError')),
  });

/**
 * The account an organization's invitation is redeemed for. Built per render,
 * so its messages follow the active locale.
 *
 * An organization that enforces SSO holds no password of its own, and the API
 * refuses one, so those two fields carry no rules and are never shown. Both
 * branches infer the same fields, so the form keeps one type across a reload
 * that changes the answer.
 *
 * @param options.isSsoEnforced - Whether the organization signs its people in through SSO only.
 * @returns The schema.
 */
export const buildOrganizationInviteSchema = ({ isSsoEnforced }: { isSsoEnforced: boolean }) => {
  if (isSsoEnforced) {
    return _accountSchema().extend({
      password: z.string(),
      confirm_password: z.string(),
    });
  }

  return _accountSchema()
    .extend({
      password: z.string().min(10, akMT('passwordMinLengthError')),
      confirm_password: z.string().min(1, akMT('enterConfirmPassword')),
    })
    .refine((values) => values.password === values.confirm_password, {
      message: akMT('passwordMatchError'),
      path: ['confirm_password'],
    });
};

export type OrganizationInviteFormSchema = z.infer<ReturnType<typeof _accountSchema>> & {
  password: string;
  confirm_password: string;
};

/**
 * The field this form's controls are built from, bound to the schema above so
 * every `name` is checked against it.
 */
export const OrganizationInviteFormField = createAkFormField<OrganizationInviteFormSchema>();

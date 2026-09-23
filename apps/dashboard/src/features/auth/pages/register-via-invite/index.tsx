import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { Fragment, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { RegistrationService } from '@irene/api/services/registration';
import { getApiFieldErrors, unlessRateLimited } from '@irene/api/utils/errors';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkFormField, AkFormProvider } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import {
  buildRegisterViaInviteSchema,
  type RegisterViaInviteFormSchema,
} from '@/features/auth/schemas/register-via-invite';

import { startSession } from '@/features/auth/actions/session';
import { RegisterViaInviteInvalid } from '@/features/auth/components/register-via-invite-invalid';
import { RegisterViaInviteReadOnlyField } from '@/features/auth/components/register-via-invite-read-only-field';
import { RegisterViaInviteFormSkeleton } from '@/features/auth/components/register-via-invite-skeleton';
import { AuthLayout } from '@/layouts/auth-layout';
import { invitedRegistrationOptions } from '@/queries/registration';

const inviteRoute = getRouteApi('/_unauthenticated/register-via-invite/$token');

/** The fields the API reports errors against, whichever of them it names. */
type InviteFieldError = 'username' | 'password' | 'confirm_password' | 'company' | 'terms_accepted';

/** Which form field each of those belongs to. */
const FORM_FIELD_BY_API_NAME = [
  ['username', 'username'],
  ['password', 'password'],
  ['confirm_password', 'confirmPassword'],
  ['company', 'company'],
  ['terms_accepted', 'termsAccepted'],
] as const satisfies ReadonlyArray<readonly [InviteFieldError, keyof RegisterViaInviteFormSchema]>;

/**
 * Opens the account an invitation was raised for, and signs it in.
 *
 * The address comes from the invitation and cannot be changed, so the form
 * shows it and asks for everything else. Redeeming the invitation spends it,
 * which is why a spent link says so rather than offering the form again.
 */
export function RegisterViaInvitePage() {
  const { token } = inviteRoute.useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const invitation = useQuery(invitedRegistrationOptions(token));

  const inviteForm = useForm<RegisterViaInviteFormSchema>({
    resolver: zodResolver(buildRegisterViaInviteSchema()),
    defaultValues: Object.fromEntries(FORM_FIELD_BY_API_NAME.map(([, field]) => [field, ''])),
    reValidateMode: 'onChange',
  });

  const { reset: resetForm } = inviteForm;
  const invitedRegistration = invitation.data;
  const invitedCompany = invitedRegistration?.company;
  const invitedEmail = invitedRegistration?.email;

  // Register the user via the API
  const register = useMutation({
    mutationFn: (values: RegisterViaInviteFormSchema) =>
      RegistrationService.registerViaInvite({
        token,
        username: values.username,
        password: values.password,
        confirm_password: values.confirmPassword,
        company: values.company,
        first_name: values.firstName,
        last_name: values.lastName,
        terms_accepted: values.termsAccepted,
      }),

    /* The API answers with a session, so the account is signed in where it stands. */
    onSuccess: async (session) => {
      startSession(queryClient, session);
      await navigate({ to: '/' });
    },

    // Show the errors in the form fields or notify user
    onError: unlessRateLimited((error) => {
      const messages = getApiFieldErrors<InviteFieldError>(error);
      const namedErrors = FORM_FIELD_BY_API_NAME.filter(([apiName]) => messages[apiName]?.length);

      /* A complaint about no field in particular — a spent token, or a 500. */
      if (namedErrors.length > 0) {
        namedErrors.forEach(([apiName, field]) => {
          inviteForm.setError(field, { message: messages[apiName]?.[0] });
        });
      } else {
        akNotify.error(akMT('somethingWentWrong'));
      }
    }),
  });

  // Effect to fill the form with what the invitation already knows.
  useEffect(() => {
    if (invitedRegistration) {
      resetForm({
        company: invitedRegistration.company,
        firstName: invitedRegistration.first_name,
        lastName: invitedRegistration.last_name,
        username: '',
        password: '',
        confirmPassword: '',
        termsAccepted: false,
      });
    }
  }, [invitedRegistration, resetForm]);

  return (
    /* Wider than the other signed-out pages, since this form asks for the most. */
    <AuthLayout cardClassName="max-w-111.5">
      {invitation.isPending && <RegisterViaInviteFormSkeleton />}

      {invitation.isError && <RegisterViaInviteInvalid />}

      {invitation.isSuccess && (
        <Fragment>
          <AkTypography tag="h1" variant="h4" fontWeight="bold" className="mb-5 text-xl">
            <AkMessageTranslate id="completeRegistration" />
          </AkTypography>

          <AkFormProvider {...inviteForm}>
            <form
              noValidate
              className="flex flex-col gap-3.5"
              onSubmit={inviteForm.handleSubmit((values) => register.mutate(values))}
            >
              <RegisterViaInviteReadOnlyField
                id="invited-email"
                label={akMT('emailId')}
                value={invitedEmail ?? ''}
              />

              {invitedCompany ? (
                <RegisterViaInviteReadOnlyField
                  id="invited-company"
                  label={akMT('companyName')}
                  value={invitedCompany}
                />
              ) : (
                <AkFormField name="company" label={akMT('companyName')}>
                  <AkInput
                    autoComplete="organization"
                    placeholder={akMT('companyName')}
                    data-test-invite-company-input
                  />
                </AkFormField>
              )}

              <div className="flex gap-3.5">
                <AkFormField name="firstName" label={akMT('firstName')} className="flex-1">
                  <AkInput
                    autoComplete="given-name"
                    placeholder={akMT('firstName')}
                    data-test-invite-first-name-input
                  />
                </AkFormField>

                <AkFormField name="lastName" label={akMT('lastName')} className="flex-1">
                  <AkInput
                    autoComplete="family-name"
                    placeholder={akMT('lastName')}
                    data-test-invite-last-name-input
                  />
                </AkFormField>
              </div>

              <AkFormField name="username" label={akMT('username')}>
                <AkInput
                  autoComplete="username"
                  placeholder={akMT('username')}
                  data-test-invite-username-input
                />
              </AkFormField>

              <AkFormField name="password" label={akMT('password')}>
                <AkInput
                  type="password"
                  autoComplete="new-password"
                  placeholder={akMT('passwordMinimumPlaceholder')}
                  data-test-invite-password-input
                />
              </AkFormField>

              <AkFormField name="confirmPassword" label={akMT('confirmPassword')}>
                <AkInput
                  type="password"
                  autoComplete="new-password"
                  placeholder={akMT('reenterPasswordPlaceholder')}
                  data-test-invite-confirm-password-input
                />
              </AkFormField>

              <AkFormField name="termsAccepted" className="gap-2">
                <div className="flex items-center gap-2">
                  <AkCheckbox color="success" data-test-invite-terms-checkbox />

                  <AkTypography tag="span">
                    <AkMessageTranslate id="acceptTerms" />

                    <span className="ml-0.5 text-danger" aria-hidden>
                      *
                    </span>
                  </AkTypography>
                </div>
              </AkFormField>

              <AkButton type="submit" loading={register.isPending} data-test-invite-submit-button>
                <AkMessageTranslate id="register" />
              </AkButton>
            </form>
          </AkFormProvider>
        </Fragment>
      )}
    </AuthLayout>
  );
}

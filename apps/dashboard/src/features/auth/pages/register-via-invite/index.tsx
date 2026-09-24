import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getRouteApi, useNavigate } from '@tanstack/react-router';
import { Fragment, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { RegistrationService } from '@irene/api/services/registration';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import {
  buildRegisterViaInviteSchema,
  RegisterViaInviteFormField,
  type RegisterViaInviteFormSchema,
} from '@/features/auth/schemas/register-via-invite';

import { startSession } from '@/features/auth/actions/session';
import { RegisterInvitationFormSkeleton } from '@/features/auth/components/register-invitation-form-skeleton';
import { RegisterInvitationInvalid } from '@/features/auth/components/register-invitation-invalid';
import { RegisterInvitationReadOnlyField } from '@/features/auth/components/register-invitation-read-only-field';
import { AuthLayout } from '@/layouts/auth-layout';
import { invitedRegistrationOptions } from '@/queries/registration';
import { setFormFieldErrors, toFormFieldErrors } from '@/utils/form-field-errors';

const inviteRoute = getRouteApi('/_unauthenticated/register-via-invite/$token');

/** Nothing is filled in until the invitation has been read. */
const EMPTY_FORM: RegisterViaInviteFormSchema = {
  company: '',
  first_name: '',
  last_name: '',
  username: '',
  password: '',
  confirm_password: '',
  terms_accepted: false,
};

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

  const inviteSchema = buildRegisterViaInviteSchema();

  const inviteForm = useForm<RegisterViaInviteFormSchema>({
    resolver: zodResolver(inviteSchema),
    defaultValues: EMPTY_FORM,
    reValidateMode: 'onChange',
  });

  const { reset: resetForm } = inviteForm;
  const invitedRegistration = invitation.data;
  const invitedCompany = invitedRegistration?.company;

  // Register the user via the API
  const register = useMutation({
    mutationFn: (values: RegisterViaInviteFormSchema) =>
      RegistrationService.registerViaInvite({ token, ...values }),

    /* The API answers with a session, so the account is signed in where it stands. */
    onSuccess: async (session) => {
      startSession(queryClient, session);
      await navigate({ to: '/' });
    },

    // Show the errors in the form fields or notify user
    onError: unlessRateLimited((error) => {
      /* A complaint about no field in particular — a spent token, or a 500. */
      const fieldErrors = toFormFieldErrors<RegisterViaInviteFormSchema>(inviteSchema, error);

      if (fieldErrors.length === 0) {
        akNotify.error(akMT('somethingWentWrong'));
      } else {
        setFormFieldErrors(inviteForm, fieldErrors);
      }
    }),
  });

  // Effect to fill the form with what the invitation already knows.
  useEffect(() => {
    if (invitedRegistration) {
      resetForm({
        company: invitedRegistration.company,
        first_name: invitedRegistration.first_name,
        last_name: invitedRegistration.last_name,
        username: '',
        password: '',
        confirm_password: '',
        terms_accepted: false,
      });
    }
  }, [invitedRegistration, resetForm]);

  // If the registration is not successful, show the registration form.
  return (
    <AuthLayout cardClassName="max-w-111.5">
      {invitation.isPending && <RegisterInvitationFormSkeleton />}
      {invitation.isError && <RegisterInvitationInvalid />}

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
              <RegisterInvitationReadOnlyField
                id="invited-email"
                label={akMT('emailId')}
                value={invitation.data.email}
              />

              {invitedCompany ? (
                <RegisterInvitationReadOnlyField
                  id="invited-company"
                  label={akMT('companyName')}
                  value={invitedCompany}
                />
              ) : (
                <RegisterViaInviteFormField name="company" label={akMT('companyName')}>
                  <AkInput
                    autoComplete="organization"
                    placeholder={akMT('companyName')}
                    data-test-invite-company-input
                  />
                </RegisterViaInviteFormField>
              )}

              <div className="flex gap-3.5">
                <RegisterViaInviteFormField
                  name="first_name"
                  label={akMT('firstName')}
                  className="flex-1"
                >
                  <AkInput
                    autoComplete="given-name"
                    placeholder={akMT('firstName')}
                    data-test-invite-first-name-input
                  />
                </RegisterViaInviteFormField>

                <RegisterViaInviteFormField
                  name="last_name"
                  label={akMT('lastName')}
                  className="flex-1"
                >
                  <AkInput
                    autoComplete="family-name"
                    placeholder={akMT('lastName')}
                    data-test-invite-last-name-input
                  />
                </RegisterViaInviteFormField>
              </div>

              <RegisterViaInviteFormField name="username" label={akMT('username')}>
                <AkInput
                  autoComplete="username"
                  placeholder={akMT('username')}
                  data-test-invite-username-input
                />
              </RegisterViaInviteFormField>

              <RegisterViaInviteFormField name="password" label={akMT('password')}>
                <AkInput
                  type="password"
                  autoComplete="new-password"
                  placeholder={akMT('passwordMinimumPlaceholder')}
                  data-test-invite-password-input
                />
              </RegisterViaInviteFormField>

              <RegisterViaInviteFormField name="confirm_password" label={akMT('confirmPassword')}>
                <AkInput
                  type="password"
                  autoComplete="new-password"
                  placeholder={akMT('reenterPasswordPlaceholder')}
                  data-test-invite-confirm-password-input
                />
              </RegisterViaInviteFormField>

              <RegisterViaInviteFormField name="terms_accepted" className="gap-2">
                <div className="flex items-center gap-2">
                  <AkCheckbox color="success" data-test-invite-terms-checkbox />

                  <AkTypography tag="span">
                    <AkMessageTranslate id="acceptTerms" />

                    <span className="ml-0.5 text-danger" aria-hidden>
                      *
                    </span>
                  </AkTypography>
                </div>
              </RegisterViaInviteFormField>

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

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';
import { Fragment, useEffect } from 'react';
import { useForm } from 'react-hook-form';

import { RegistrationService } from '@irene/api/services/registration';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkCheckbox } from '@irene/ui/ak-checkbox';
import { AkFormField, AkFormProvider } from '@irene/ui/ak-form';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import {
  buildOrganizationInviteSchema,
  type OrganizationInviteFormSchema,
} from '@/features/auth/schemas/organization-invite';

import { BackToLogin } from '@/features/auth/components/back-to-login';
import { RegisterInvitationFormSkeleton } from '@/features/auth/components/register-invitation-form-skeleton';
import { RegisterInvitationInvalid } from '@/features/auth/components/register-invitation-invalid';
import { RegisterInvitationReadOnlyField } from '@/features/auth/components/register-invitation-read-only-field';
import { AuthLayout } from '@/layouts/auth-layout';
import { organizationInvitationOptions } from '@/queries/registration';
import { setFormFieldErrors, toFormFieldErrors } from '@/utils/form-field-errors';

const organizationInviteRoute = getRouteApi('/_unauthenticated/invite/$token');

/** What the API accepts in place of a password, for an organization on SSO. */
const NO_PASSWORD = { password: undefined, confirm_password: undefined };

/** Nothing is filled in until the invitation has been read. */
const EMPTY_INVITE_FORM: OrganizationInviteFormSchema = {
  first_name: '',
  last_name: '',
  username: '',
  password: '',
  confirm_password: '',
  terms_accepted: false,
};

/**
 * Opens the account an organization invited someone to join it with.
 *
 * The address and the organization come from the invitation and cannot be
 * changed. An organization that enforces SSO holds no password, so those two
 * fields are dropped and the provider is left to hold the credential.
 *
 * `POST api/invite/<token>` answers 204 and grants no session, so the account
 * is asked to sign in rather than landing in the dashboard.
 */
export function OrganizationInvitePage() {
  const { token } = organizationInviteRoute.useParams();
  const invitation = useQuery(organizationInvitationOptions(token));

  const isSsoEnforced = invitation.data?.is_sso_enforced ?? false;
  const inviteSchema = buildOrganizationInviteSchema({ isSsoEnforced });

  const inviteForm = useForm<OrganizationInviteFormSchema>({
    resolver: zodResolver(inviteSchema),
    defaultValues: EMPTY_INVITE_FORM,
    reValidateMode: 'onChange',
  });

  const { reset: resetForm } = inviteForm;

  // Mutation to accept the invitation.
  const acceptInvitation = useMutation({
    mutationFn: (values: OrganizationInviteFormSchema) =>
      RegistrationService.acceptOrganizationInvitation({
        token,
        account: isSsoEnforced ? { ...values, ...NO_PASSWORD } : values,
      }),

    onError: unlessRateLimited((error) => {
      const fieldErrors = toFormFieldErrors<OrganizationInviteFormSchema>(inviteSchema, error);

      if (fieldErrors.length === 0) {
        akNotify.error(akMT('somethingWentWrong'));
      } else {
        setFormFieldErrors(inviteForm, fieldErrors);
      }
    }),
  });

  // Effect to clear anything typed before the invitation API response,
  // so the rules it decides apply to empty fields.
  useEffect(() => {
    resetForm(EMPTY_INVITE_FORM);
  }, [isSsoEnforced, resetForm]);

  // If the invitation is accepted, show the confirmation page.
  if (acceptInvitation.isSuccess) {
    return (
      <AuthLayout footer={<BackToLogin />}>
        <div
          className="flex flex-col items-center gap-2"
          data-test-organization-invite-confirmation
        >
          <AkIcon name="material-symbols:check-circle" className="size-10 text-success" />

          <AkTypography tag="h1" variant="h4" fontWeight="bold" align="center" className="text-xl">
            <AkMessageTranslate id="invitationRegisterConfirmation" />
          </AkTypography>

          <AkTypography color="textSecondary" align="center">
            <AkMessageTranslate id="pleaseLogin" />
          </AkTypography>
        </div>
      </AuthLayout>
    );
  }

  // If the invitation is not accepted, show the invite form.
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
              onSubmit={inviteForm.handleSubmit((values) => acceptInvitation.mutate(values))}
            >
              <RegisterInvitationReadOnlyField
                id="invited-email"
                label={akMT('emailId')}
                value={invitation.data.email}
              />

              <RegisterInvitationReadOnlyField
                id="invited-company"
                label={akMT('companyName')}
                value={invitation.data.company}
              />

              <div className="flex gap-3.5">
                <AkFormField name="first_name" label={akMT('firstName')} className="flex-1">
                  <AkInput
                    autoComplete="given-name"
                    placeholder={akMT('firstName')}
                    data-test-organization-invite-first-name-input
                  />
                </AkFormField>

                <AkFormField name="last_name" label={akMT('lastName')} className="flex-1">
                  <AkInput
                    autoComplete="family-name"
                    placeholder={akMT('lastName')}
                    data-test-organization-invite-last-name-input
                  />
                </AkFormField>
              </div>

              <AkFormField name="username" label={akMT('username')}>
                <AkInput
                  autoComplete="username"
                  placeholder={akMT('username')}
                  data-test-organization-invite-username-input
                />
              </AkFormField>

              {!isSsoEnforced && (
                <Fragment>
                  <AkFormField name="password" label={akMT('password')}>
                    <AkInput
                      type="password"
                      autoComplete="new-password"
                      placeholder={akMT('passwordMinimumPlaceholder')}
                      data-test-organization-invite-password-input
                    />
                  </AkFormField>

                  <AkFormField name="confirm_password" label={akMT('confirmPassword')}>
                    <AkInput
                      type="password"
                      autoComplete="new-password"
                      placeholder={akMT('reenterPasswordPlaceholder')}
                      data-test-organization-invite-confirm-password-input
                    />
                  </AkFormField>
                </Fragment>
              )}

              <AkFormField name="terms_accepted" className="gap-2">
                <div className="flex items-center gap-2">
                  <AkCheckbox color="success" data-test-organization-invite-terms-checkbox />

                  <AkTypography tag="span">
                    <AkMessageTranslate id="acceptTerms" />

                    <span className="ml-0.5 text-danger" aria-hidden>
                      *
                    </span>
                  </AkTypography>
                </div>
              </AkFormField>

              <AkButton
                type="submit"
                loading={acceptInvitation.isPending}
                data-test-organization-invite-submit-button
              >
                <AkMessageTranslate id="register" />
              </AkButton>
            </form>
          </AkFormProvider>
        </Fragment>
      )}
    </AuthLayout>
  );
}

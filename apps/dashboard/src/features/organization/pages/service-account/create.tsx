import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  SERVICE_ACCOUNT_TYPE,
  ServiceAccountService,
  type ApiServiceAccount,
  type ApiServiceAccountScopes,
} from '@irene/api/services/service-account';

import { getApiFieldErrors } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';
import type { ApiOrganizationProject } from '@irene/api/services/organization';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { ORGANIZATION_SETTINGS_TABS } from '@/features/organization/layout/settings-tabs';
import { useUrlState } from '@/hooks/use-url-state';
import { serviceAccountOptions } from '@/queries/service-account';

import { AccessTokenSection } from './components/access-token';
import { AccountOverviewSection } from './components/account-overview';
import { ServiceAccountScreenSkeleton } from './components/screen-skeleton';
import { SelectProjectSection } from './components/select-project';
import { SelectScopeSection } from './components/select-scope';
import { DEFAULT_EXPIRY_IN_DAYS, expiryDateIn } from './expiry';
import { buildServiceAccountSchema, type ServiceAccountFormSchema } from './schemas/create';
import { applyScopeChange, NO_SCOPES, pickScopes, type ScopeNode } from './scopes';

/* The account a new one is copied from, which irene names in the same parameter. */
const CREATE_URL_STATE = { duplicate: 0 };

/** Where the account's own screen lives, which a made account is read on. */
const detailsAddress = (serviceAccountId: number) =>
  `${ORGANIZATION_SETTINGS_TABS.serviceAccount}/${serviceAccountId}`;

/**
 * The screen a service account is made on.
 *
 * Everything on it is held here until it is saved: the account does not exist
 * until then, so its scopes, its expiry and the projects it reaches have
 * nowhere to be written. Saving makes the account, then gives it each chosen
 * project, as irene does in that order.
 *
 * Where the address names an account to copy, the screen opens on that
 * account's name, description, scopes and project setting. Its projects are not
 * copied, as irene does not copy them either.
 */
export function OrganizationServiceAccountCreatePage() {
  const [urlState] = useUrlState(CREATE_URL_STATE);

  const copiedFrom = useQuery(
    serviceAccountOptions(urlState.duplicate > 0 ? urlState.duplicate : undefined)
  );

  /* Each left unset until the reader says otherwise, so what is copied stands in meanwhile. */
  const [chosenScopes, setChosenScopes] = useState<ApiServiceAccountScopes | null>(null);
  const [chosenDoesNotExpire, setChosenDoesNotExpire] = useState<boolean | null>(null);
  const [chosenAllProjects, setChosenAllProjects] = useState<boolean | null>(null);

  const [expiryInDays, setExpiryInDays] = useState(DEFAULT_EXPIRY_IN_DAYS);
  const [projects, setProjects] = useState<ApiOrganizationProject[]>([]);
  const [made, setMade] = useState<ApiServiceAccount | null>(null);

  const createForm = useForm<ServiceAccountFormSchema>({
    resolver: zodResolver(buildServiceAccountSchema()),
    defaultValues: { name: '', description: '' },

    /* Written over once the account being copied is read, and left alone otherwise. */
    values: copiedFrom.data
      ? { name: copiedFrom.data.name, description: copiedFrom.data.description }
      : undefined,

    mode: 'onChange',
  });

  const scopes = chosenScopes ?? (copiedFrom.data ? pickScopes(copiedFrom.data) : NO_SCOPES);
  const allProjects = chosenAllProjects ?? copiedFrom.data?.all_projects ?? true;

  /* An account that never expires is copied as one, and the default stands otherwise. */
  const doesNotExpire =
    chosenDoesNotExpire ?? (copiedFrom.data ? copiedFrom.data.expiry === null : false);

  const create = useMutation({
    mutationFn: async (details: ServiceAccountFormSchema) => {
      const account = await ServiceAccountService.createServiceAccount({
        name: details.name.trim(),
        description: details.description.trim(),
        expiry: doesNotExpire ? null : expiryDateIn(expiryInDays).toISOString(),
        all_projects: allProjects,
        service_account_type: SERVICE_ACCOUNT_TYPE.user,
        ...scopes,
      });

      /* The projects can only be given once the account they are given to exists. */
      if (!allProjects) {
        for (const project of projects) {
          await ServiceAccountService.addServiceAccountProject(account.id, project.id);
        }
      }

      return account;
    },

    onSuccess: (account) => {
      akNotify.success(akMT('serviceAccountModule.createSuccessMsg'));
      setMade(account);
    },

    /* The endpoint names the field it refused, which irene reports as "field - reason". */
    onError: (error) => {
      const [field, messages] = Object.entries(getApiFieldErrors(error))[0] ?? [];

      akNotify.error(field && messages?.[0] ? `${field} - ${messages[0]}` : akMT('pleaseTryAgain'));
    },
  });

  /* Only while an account is being copied: nothing is read when one is made from nothing. */
  if (copiedFrom.isLoading) {
    return <ServiceAccountScreenSkeleton />;
  }

  const changeScope = (node: ScopeNode, isGranted: boolean) =>
    setChosenScopes(applyScopeChange(scopes, node, isGranted));

  return (
    <div
      className="flex min-h-[calc(100vh-56px)] w-full flex-col bg-background-subtle"
      data-test-service-account-create
    >
      {/*
        Pinned as one, so no seam opens between the trail and the header to scroll through.
        It sticks 7px above where it sits, which is the padding the host's scrolling region
        holds: without that it would pin below the region's edge and the page would scroll
        through the strip left above it.
      */}
      <div className="sticky -top-1.75 z-10 bg-background-subtle pt-3.5">
        <div className="pb-5.25">
          <Breadcrumbs />
        </div>

        <div
          className="
            flex items-center justify-between gap-2.75 rounded-xs border border-border bg-background
            p-5.25
          "
        >
          <div className="flex flex-col gap-1">
            <AkTypography tag="h2" variant="subtitle1" data-test-service-account-create-title>
              {akMT('serviceAccountModule.createTitle')}
            </AkTypography>

            <AkTypography
              variant="body2"
              color="textSecondary"
              data-test-service-account-create-description
            >
              {akMT('serviceAccountModule.createDescription')}
            </AkTypography>
          </div>

          <div className="flex items-center gap-2.75">
            {made ? (
              <AkButton asChild data-test-service-account-create-done>
                <Link to={detailsAddress(made.id)}>{akMT('viewDetails')}</Link>
              </AkButton>
            ) : (
              <AkButton
                variant="outlined"
                color="neutral"
                asChild
                disabled={create.isPending}
                data-test-service-account-create-cancel
              >
                <Link to={ORGANIZATION_SETTINGS_TABS.serviceAccount}>{akMT('cancel')}</Link>
              </AkButton>
            )}

            {!made && (
              <AkButton
                loading={create.isPending}
                onClick={() => void createForm.handleSubmit((details) => create.mutate(details))()}
                data-test-service-account-create-save
              >
                {akMT('save')}
              </AkButton>
            )}
          </div>
        </div>
      </div>

      <div className="my-5.25 flex w-full flex-col gap-5.25">
        <AkFormProvider {...createForm}>
          <form noValidate>
            <AccountOverviewSection />
          </form>
        </AkFormProvider>

        <AccessTokenSection
          secret={made?.secret_access_key}
          expiryInDays={expiryInDays}
          onExpiryInDaysChange={setExpiryInDays}
          doesNotExpire={doesNotExpire}
          onDoesNotExpireChange={setChosenDoesNotExpire}
        />

        <SelectScopeSection scopes={scopes} onChange={changeScope} />

        <SelectProjectSection
          allProjects={allProjects}
          onAllProjectsChange={setChosenAllProjects}
          projects={projects}
          onProjectsChange={setProjects}
        />
      </div>
    </div>
  );
}

import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  ServiceAccountService,
  type ApiServiceAccount,
  type ApiServiceAccountScopes,
} from '@irene/api/services/service-account';

import {
  AkMenu,
  AkMenuContent,
  AkMenuItem,
  AkMenuSeparator,
  AkMenuTrigger,
} from '@irene/ui/ak-menu';

import { getApiErrorMessage } from '@irene/api/utils/errors';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { Breadcrumbs } from '@/components/breadcrumbs';
import { ORGANIZATION_SETTINGS_TABS } from '@/features/organization/layout/settings-tabs';
import { serviceAccountKeys, serviceAccountOptions } from '@/queries/service-account';

import { AccessTokenSection } from './components/access-token';
import { AccountOverviewSection } from './components/account-overview';
import { ConfirmDrawer } from './components/confirm-drawer';
import { ServiceAccountScreenSkeleton } from './components/screen-skeleton';
import { SelectScopeSection } from './components/select-scope';
import { DEFAULT_EXPIRY_IN_DAYS, expiryDateIn } from './expiry';
import { buildServiceAccountSchema, type ServiceAccountFormSchema } from './schemas/create';
import { applyScopeChange, pickScopes, type ScopeNode } from './scopes';

/** Which section of the account is open for changes, where one is. */
type OpenSection = 'overview' | 'token' | 'scope' | null;

/**
 * One service account: what it is, what it may do, and how long its key lasts.
 *
 * Each section is read until it is opened, and each writes on its own — irene
 * saves a section at a time rather than the page as a whole, so a change to the
 * scopes never carries an unsaved name with it.
 *
 * @param props.serviceAccountId - Which account this screen is of.
 */
export function OrganizationServiceAccountDetailsPage({
  serviceAccountId,
}: Readonly<{ serviceAccountId: number }>) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState<OpenSection>(null);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false);
  const [scopeEdits, setScopeEdits] = useState<ApiServiceAccountScopes | null>(null);
  const [expiryInDays, setExpiryInDays] = useState(DEFAULT_EXPIRY_IN_DAYS);
  const [doesNotExpire, setDoesNotExpire] = useState(false);
  const [secret, setSecret] = useState<string | undefined>(undefined);

  const account = useQuery(serviceAccountOptions(serviceAccountId));

  const overviewForm = useForm<ServiceAccountFormSchema>({
    resolver: zodResolver(buildServiceAccountSchema()),
    values: { name: account.data?.name ?? '', description: account.data?.description ?? '' },
    mode: 'onChange',
  });

  const refreshAccount = () =>
    queryClient.invalidateQueries({ queryKey: serviceAccountKeys.detail(serviceAccountId) });

  const reportRefusal = (error: unknown) =>
    akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));

  const saveSection = useMutation({
    /* The endpoint takes the account entire, so the one on screen carries the change. */
    mutationFn: ({
      serviceAccount,
      changes,
    }: {
      serviceAccount: ApiServiceAccount;
      changes: Parameters<typeof ServiceAccountService.updateServiceAccount>[1];
    }) => ServiceAccountService.updateServiceAccount(serviceAccount, changes),

    onSuccess: async () => {
      akNotify.success(akMT('serviceAccountModule.editSuccessMsg'));
      setOpen(null);
      setScopeEdits(null);

      await refreshAccount();
    },

    onError: reportRefusal,
  });

  const regenerateKey = useMutation({
    mutationFn: () =>
      ServiceAccountService.resetServiceAccountKey(
        serviceAccountId,
        doesNotExpire ? null : expiryDateIn(expiryInDays).toISOString()
      ),

    onSuccess: async (renewed) => {
      /* Answered once, so it is held here until the screen is left. */
      setSecret(renewed.secret_access_key);
      setOpen(null);

      await refreshAccount();
    },

    onError: reportRefusal,
  });

  const withdraw = useMutation({
    mutationFn: () => ServiceAccountService.deleteServiceAccount(serviceAccountId),

    onSuccess: async () => {
      akNotify.success(akMT('serviceAccountModule.deleteSuccessMsg'));
      setIsConfirmingDelete(false);

      await queryClient.invalidateQueries({ queryKey: serviceAccountKeys.list() });

      window.location.assign(ORGANIZATION_SETTINGS_TABS.serviceAccount);
    },

    onError: reportRefusal,
  });

  if (account.isPending || !account.data) {
    return <ServiceAccountScreenSkeleton />;
  }

  const scopes = scopeEdits ?? account.data;

  return (
    <div
      className="flex min-h-[calc(100vh-56px)] w-full flex-col bg-background-subtle"
      data-test-service-account-details
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
            <AkTypography tag="h2" variant="subtitle1" data-test-service-account-details-title>
              {akMT('serviceAccountModule.detailsTitle')}
            </AkTypography>

            <AkTypography variant="body2" color="textSecondary">
              {akMT('serviceAccountModule.detailsDescription')}
            </AkTypography>
          </div>

          <AkMenu>
            <AkMenuTrigger asChild>
              <AkIconButton
                variant="outlined"
                aria-label={akMT('moreOptions')}
                data-test-service-account-details-more
              >
                <AkIcon name="material-symbols:more-vert" />
              </AkIconButton>
            </AkMenuTrigger>

            <AkMenuContent align="end" arrow>
              <AkMenuItem asChild data-test-service-account-details-duplicate>
                <a
                  href={`${ORGANIZATION_SETTINGS_TABS.serviceAccount}/create?duplicate=${serviceAccountId}`}
                >
                  {akMT('serviceAccountModule.duplicate')}
                </a>
              </AkMenuItem>

              <AkMenuSeparator />

              <AkMenuItem
                onSelect={() => setIsConfirmingDelete(true)}
                data-test-service-account-details-delete
              >
                {akMT('delete')}
              </AkMenuItem>
            </AkMenuContent>
          </AkMenu>
        </div>
      </div>

      <div className="my-5.25 flex w-full flex-col gap-5.25">
        <AkFormProvider {...overviewForm}>
          <form noValidate>
            <AccountOverviewSection
              serviceAccount={account.data}
              isEditing={open === 'overview'}
              isSaving={saveSection.isPending}
              onEdit={() => setOpen('overview')}
              onCancel={() => {
                overviewForm.reset();
                setOpen(null);
              }}
              onSave={() =>
                void overviewForm.handleSubmit((details) =>
                  saveSection.mutate({
                    serviceAccount: account.data,

                    changes: {
                      name: details.name.trim(),
                      description: details.description.trim(),
                    },
                  })
                )()
              }
            />
          </form>
        </AkFormProvider>

        <AccessTokenSection
          serviceAccount={account.data}
          secret={secret}
          isEditing={open === 'token'}
          isSaving={regenerateKey.isPending}
          expiryInDays={expiryInDays}
          doesNotExpire={doesNotExpire}
          onExpiryInDaysChange={setExpiryInDays}
          onDoesNotExpireChange={setDoesNotExpire}
          onEdit={() => setOpen('token')}
          onRegenerate={() => regenerateKey.mutate()}
          onCancel={() => {
            setExpiryInDays(DEFAULT_EXPIRY_IN_DAYS);
            setDoesNotExpire(account.data.expiry === null);
            setOpen(null);
          }}
        />

        <SelectScopeSection
          isReading
          scopes={scopes}
          isEditing={open === 'scope'}
          isSaving={saveSection.isPending}
          onEdit={() => setOpen('scope')}
          onCancel={() => {
            setScopeEdits(null);
            setOpen(null);
          }}
          onSave={() =>
            saveSection.mutate({
              serviceAccount: account.data,
              changes: pickScopes(scopeEdits ?? account.data),
            })
          }
          onChange={(node: ScopeNode, isGranted: boolean) =>
            setScopeEdits((current) => applyScopeChange(current ?? account.data, node, isGranted))
          }
        />
      </div>

      <ConfirmDrawer
        isOpen={isConfirmingDelete}
        confirmText={akMT('delete')}
        isWorking={withdraw.isPending}
        onConfirm={() => withdraw.mutate()}
        onCancel={() => setIsConfirmingDelete(false)}
      >
        <AkTypography data-test-service-account-details-delete-question>
          <AkMessageTranslate
            id="serviceAccountModule.deleteConfirmText"
            values={{ name: account.data.name }}
          />
        </AkTypography>
      </ConfirmDrawer>
    </div>
  );
}

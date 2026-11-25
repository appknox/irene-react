import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';

import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

import { IntegrationService } from '@irene/api/services/integration';
import { getApiFieldErrors } from '@irene/api/utils/errors';
import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';
import serviceNowIcon from '@irene/ui/images/service-now.png';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { integrationKeys, serviceNowIntegrationOptions } from '@/queries/integration';

import {
  buildServiceNowSchema,
  ServiceNowFormField,
  type ServiceNowFormSchema,
} from '../schemas/integration-forms';

import { IntegratedAccount } from './integrated-account';
import { IntegrationCard } from './integration-card';
import { IntegrationDrawer } from './integration-drawer';
import { RevokeQuestion } from './revoke-question';

/** The tables ServiceNow raises items in, named as ServiceNow names them. */
const TABLES = [
  {
    label: 'sn_vul_app_vulnerable_item',
    value: ENUMS.SERVICE_NOW_TABLE_SELECTION.SN_VUL_APP_VULNERABLE_ITEM,
  },
  {
    label: 'sn_vul_vulnerable_item',
    value: ENUMS.SERVICE_NOW_TABLE_SELECTION.SN_VUL_VULNERABLE_ITEM,
  },
];

/**
 * ServiceNow, which takes an instance, an account on it and the table to raise items in.
 *
 * The password is held by the server once sent, so a connected instance shows
 * what it points at rather than the form: changing it means connecting again.
 */
export function ServiceNowIntegration() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [table, setTable] = useState(String(TABLES[0]?.value));

  const serviceNow = useQuery(serviceNowIntegrationOptions(selected?.id));

  const connection = serviceNow.data ?? null;
  const isConnected = Boolean(connection?.instance_url && connection?.username);

  const serviceNowForm = useForm<ServiceNowFormSchema>({
    resolver: zodResolver(buildServiceNowSchema()),
    defaultValues: { instanceUrl: '', username: '', password: '' },
    mode: 'onChange',
  });

  const connect = useMutation({
    mutationFn: (details: ServiceNowFormSchema) =>
      IntegrationService.setServiceNowIntegration(Number(selected?.id), {
        instance_url: details.instanceUrl.trim(),
        username: details.username.trim(),
        password: details.password,
        table_name: Number(table),
      }),

    onSuccess: async () => {
      akNotify.success(akMT('serviceNowIntegrated'));

      await queryClient.invalidateQueries({
        queryKey: integrationKeys.serviceNow(selected?.id),
      });
    },

    /* The endpoint names the field it refused, which irene reports as "field - reason". */
    onError: (error) => {
      const [field, messages] = Object.entries(getApiFieldErrors(error))[0] ?? [];

      akNotify.error(field && messages?.[0] ? `${field} - ${messages[0]}` : akMT('pleaseTryAgain'));
    },
  });

  const revoke = useMutation({
    mutationFn: () => IntegrationService.revokeServiceNowIntegration(Number(selected?.id)),

    onSuccess: async () => {
      akNotify.success(akMT('serviceNow.willBeRevoked'));
      setIsAsking(false);
      setIsDrawerOpen(false);
      serviceNowForm.reset();

      await queryClient.invalidateQueries({
        queryKey: integrationKeys.serviceNow(selected?.id),
      });
    },

    onError: () => {
      akNotify.error(akMT('pleaseTryAgain'));
    },
  });

  /* Shown while the connection is read as well, so the panel never opens on a form it replaces. */
  const showsConnection = isConnected || serviceNow.isPending;

  return (
    <Fragment>
      <IntegrationCard
        isLoading={serviceNow.isPending}
        data={{
          id: 'ServiceNow',
          title: akMT('serviceNow.title'),
          description: akMT('serviceNowIntegrationDesc'),
          logo: serviceNowIcon,
          isIntegrated: isConnected,
        }}
        onIntegrate={() => setIsDrawerOpen(true)}
      />

      <IntegrationDrawer
        isOpen={isDrawerOpen}
        title={isAsking ? akMT('confirmation') : akMT('serviceNowIntegration')}
        isSaving={connect.isPending || revoke.isPending}
        showDisconnect={showsConnection}
        onSave={() =>
          showsConnection
            ? setIsAsking(true)
            : void serviceNowForm.handleSubmit((details) => connect.mutate(details))()
        }
        onClose={() => {
          setIsDrawerOpen(false);
          setIsAsking(false);
        }}
      >
        {isAsking && (
          <RevokeQuestion
            question={akMT('confirmBox.revokeServiceNow')}
            isRevoking={revoke.isPending}
            onConfirm={() => revoke.mutate()}
            onCancel={() => setIsAsking(false)}
          />
        )}

        {!isAsking && showsConnection && (
          <div className="flex flex-col p-5.25">
            <IntegratedAccount
              logo={serviceNowIcon}
              logoAlt={akMT('serviceNow.title')}
              hostUrl={connection?.instance_url ?? ''}
              propertyTitle={akMT('username')}
              property={connection?.username ?? ''}
              isLoading={serviceNow.isPending}
            />
          </div>
        )}

        {!isAsking && !showsConnection && (
          <AkFormProvider {...serviceNowForm}>
            <form
              noValidate
              className="
                m-5.25 flex min-w-87.5 max-w-100 flex-col gap-2 rounded-xs border border-border
                p-3.5
              "
            >
              <ServiceNowFormField name="instanceUrl" label={akMT('instanceURL')}>
                <AkInput
                  placeholder={akMT('serviceNow.enterInstanceURL')}
                  data-test-service-now-instance-url
                />
              </ServiceNowFormField>

              <ServiceNowFormField name="username" label={akMT('username')}>
                <AkInput placeholder={akMT('enterUsername')} data-test-service-now-username />
              </ServiceNowFormField>

              <ServiceNowFormField name="password" label={akMT('password')}>
                <AkInput
                  type="password"
                  autoComplete="service-now-password"
                  placeholder={akMT('enterPassword')}
                  data-test-service-now-password
                />
              </ServiceNowFormField>

              <div className="flex flex-col gap-1">
                <AkLabel htmlFor="service-now-table" className="text-md font-medium">
                  {akMT('serviceNow.serviceNowTable')}
                </AkLabel>

                <AkSelect value={table} onValueChange={setTable}>
                  <AkSelectTrigger
                    id="service-now-table"
                    className="w-80 bg-background"
                    data-test-service-now-table
                  >
                    <AkSelectValue placeholder={akMT('serviceNow.selectServiceNowTable')} />
                  </AkSelectTrigger>

                  <AkSelectContent>
                    {TABLES.map((option) => (
                      <AkSelectItem key={option.value} value={String(option.value)}>
                        {option.label}
                      </AkSelectItem>
                    ))}
                  </AkSelectContent>
                </AkSelect>
              </div>
            </form>
          </AkFormProvider>
        )}
      </IntegrationDrawer>
    </Fragment>
  );
}

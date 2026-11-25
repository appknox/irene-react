import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';

import { IntegrationService } from '@irene/api/services/integration';
import { getApiErrorPayload } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';
import { AkRadio, AkRadioGroup } from '@irene/ui/ak-radio';
import { AkTypography } from '@irene/ui/ak-typography';
import jiraIcon from '@irene/ui/images/jira-icon.png';
import { akNotify } from '@irene/ui/notify';

import {
  integrationKeys,
  jiraIntegrationOptions,
  jiraSecurityOptions,
} from '@/queries/integration';

import { useOrganization } from '@/hooks/use-organization';

import { buildJiraSchema, JiraFormField, type JiraFormSchema } from '../schemas/integration-forms';
import { IntegratedAccount } from './integrated-account';
import { IntegrationCard } from './integration-card';
import { IntegrationDrawer } from './integration-drawer';
import { JiraSecurity } from './jira-security';
import { RevokeQuestion } from './revoke-question';

/** The three ways an organization connects to Jira, only one of which may be in use. */
type JiraType = 'cloud' | 'dataCenter' | 'cloudSecurity';

const TYPES: { value: JiraType; label: () => string }[] = [
  { value: 'cloud', label: () => akMT('jiraCloud') },
  { value: 'dataCenter', label: () => akMT('jiraDataCenter') },
  { value: 'cloudSecurity', label: () => akMT('jiraSecurity.title') },
];

/** What a refused connection says, in the order irene reads the payload. */
function _refusalMessage(error: unknown) {
  const payload = getApiErrorPayload<Record<string, string[] | string>>(error);

  if (!payload) {
    return akMT('pleaseTryAgain');
  }

  if (Array.isArray(payload.host)) {
    return payload.host[0] ?? akMT('pleaseTryAgain');
  }

  if (typeof payload.detail === 'string') {
    return payload.detail;
  }

  if (payload.username || payload.password) {
    return akMT('tInValidCredentials');
  }

  return akMT('pleaseTryAgain');
}

/**
 * Jira, which an organization reaches in one of three ways.
 *
 * Cloud and data centre are the same credentials against a different host, and
 * differ only in what the credential is called. Cloud Security is Jira's own
 * security tab, which Jira completes from its side and which has a panel of its
 * own. Only one may be in use, so the choice disables the others once anything
 * is connected.
 */
export function JiraIntegration() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [type, setType] = useState<JiraType>('cloud');

  const jira = useQuery(jiraIntegrationOptions(selected?.id));

  /*
    Read here rather than left to the panel: which choices the card offers
    depends on it, and irene asks for it as the card is built.
  */
  const jiraSecurity = useQuery(jiraSecurityOptions(selected?.id));

  const connection = jira.data ?? null;
  const isAccountConnected = connection !== null;
  const securityStatus = jiraSecurity.data?.status ?? 'not_connected';
  const isSecurityConnected = securityStatus === 'connected';
  const hasSecuritySetup = securityStatus !== 'not_connected';

  const isDataCenter = type === 'dataCenter';
  const credentialLabel = isDataCenter ? akMT('accessToken') : akMT('apiKey');
  const credentialPlaceholder = isDataCenter ? akMT('enterAccessToken') : akMT('enterApiKey');

  const jiraForm = useForm<JiraFormSchema>({
    resolver: zodResolver(buildJiraSchema()),
    defaultValues: { host: '', username: '', password: '' },
    mode: 'onChange',
  });

  const connect = useMutation({
    mutationFn: (details: JiraFormSchema) =>
      IntegrationService.setJiraIntegration(Number(selected?.id), {
        host: details.host.trim(),
        username: details.username.trim(),
        password: details.password,
        is_data_center: isDataCenter,
      }),

    onSuccess: async () => {
      akNotify.success(akMT('jiraIntegrated'));

      await queryClient.invalidateQueries({ queryKey: integrationKeys.jira(selected?.id) });
    },

    onError: (error) => {
      akNotify.error(_refusalMessage(error));
    },
  });

  const revoke = useMutation({
    mutationFn: () => IntegrationService.revokeJiraIntegration(Number(selected?.id)),

    onSuccess: async () => {
      akNotify.success(akMT('jiraWillBeRevoked'));
      setIsAsking(false);
      jiraForm.reset();

      await queryClient.invalidateQueries({ queryKey: integrationKeys.jira(selected?.id) });
    },

    onError: () => {
      akNotify.error(akMT('pleaseTryAgain'));
    },
  });

  /* Which choice the panel opens on: whatever is already connected, else cloud. */
  const openDrawer = () => {
    if (isAccountConnected) {
      setType(connection.is_data_center ? 'dataCenter' : 'cloud');
    } else if (hasSecuritySetup) {
      setType('cloudSecurity');
    } else {
      setType('cloud');
    }

    setIsDrawerOpen(true);
  };

  const isCloudSecurity = type === 'cloudSecurity';

  /* Shown while the connection is read as well, so the panel never opens on a form it replaces. */
  const showsConnection = isAccountConnected || jira.isPending;

  return (
    <Fragment>
      <IntegrationCard
        isLoading={jira.isPending}
        data={{
          id: 'JIRA',
          title: akMT('jira'),
          description: akMT('jiraIntegrationDesc'),
          logo: jiraIcon,
          isIntegrated: isAccountConnected || isSecurityConnected,
        }}
        onIntegrate={openDrawer}
      />

      <IntegrationDrawer
        isOpen={isDrawerOpen}
        title={isAsking ? akMT('confirmation') : akMT('jiraIntegration')}
        isSaving={connect.isPending || revoke.isPending}
        showDisconnect={showsConnection}
        noFooter={isCloudSecurity || isAsking}
        onSave={() =>
          showsConnection
            ? setIsAsking(true)
            : void jiraForm.handleSubmit((details) => connect.mutate(details))()
        }
        onClose={() => {
          setIsDrawerOpen(false);
          setIsAsking(false);
        }}
      >
        {isAsking && (
          <RevokeQuestion
            question={akMT('confirmBox.revokeJira')}
            isRevoking={revoke.isPending}
            onConfirm={() => revoke.mutate()}
            onCancel={() => setIsAsking(false)}
          />
        )}

        {!isAsking && (
          <Fragment>
            <AkRadioGroup
              value={type}
              className="p-5.25"
              onValueChange={(next) => setType(next as JiraType)}
            >
              {TYPES.map((choice) => (
                <div key={choice.value} className="flex items-center gap-1">
                  <AkRadio
                    id={`jira-type-${choice.value}`}
                    value={choice.value}
                    /*
                      One connection at a time: the account types are closed off
                      once Security is set up, and Security once an account is
                      connected.
                    */
                    disabled={
                      choice.value === 'cloudSecurity' ? isAccountConnected : hasSecuritySetup
                    }
                    data-test-jira-type={choice.value}
                  />

                  <AkLabel htmlFor={`jira-type-${choice.value}`}>{choice.label()}</AkLabel>
                </div>
              ))}
            </AkRadioGroup>

            {(isAccountConnected || hasSecuritySetup) && (
              <AkTypography
                variant="body2"
                color="textSecondary"
                className="w-112.5 px-5.25"
                data-test-jira-one-at-a-time
              >
                {akMT('jiraOneIntegrationAtATime')}
              </AkTypography>
            )}

            {isCloudSecurity && <JiraSecurity />}

            {!isCloudSecurity && showsConnection && (
              <div className="flex flex-col p-5.25">
                <IntegratedAccount
                  logo={jiraIcon}
                  logoAlt={akMT('jira')}
                  hostUrl={connection?.host ?? ''}
                  propertyTitle={akMT('username')}
                  property={connection?.username ?? ''}
                  isLoading={jira.isPending}
                />
              </div>
            )}

            {!isCloudSecurity && !showsConnection && (
              <AkFormProvider {...jiraForm}>
                <form
                  noValidate
                  className="
                    mx-5.25 mt-3.5 flex w-112.5 flex-col gap-2 rounded-xs border border-border p-3.5
                  "
                >
                  <JiraFormField name="host" label={akMT('jiraHost')}>
                    <AkInput placeholder={akMT('enterJiraHost')} data-test-jira-host />
                  </JiraFormField>

                  <JiraFormField name="username" label={akMT('username')}>
                    <AkInput placeholder={akMT('enterUsername')} data-test-jira-username />
                  </JiraFormField>

                  <JiraFormField name="password" label={credentialLabel}>
                    <AkInput
                      type="password"
                      autoComplete="jira-password"
                      placeholder={credentialPlaceholder}
                      data-test-jira-credential
                    />
                  </JiraFormField>
                </form>
              </AkFormProvider>
            )}
          </Fragment>
        )}
      </IntegrationDrawer>
    </Fragment>
  );
}

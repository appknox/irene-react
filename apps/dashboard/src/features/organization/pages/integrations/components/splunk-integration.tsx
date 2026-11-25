import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';

import { IntegrationService, type SplunkIntegrationRequest } from '@irene/api/services/integration';
import { getApiFieldErrors } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import splunkIcon from '@irene/ui/images/splunk-icon.png';
import { akNotify } from '@irene/ui/notify';

import {
  integrationKeys,
  splunkIndexesOptions,
  splunkIntegrationOptions,
} from '@/queries/integration';

import { useOrganization } from '@/hooks/use-organization';

import { buildSplunkSchema, type SplunkFormSchema } from '../schemas/integration-forms';
import { IntegratedAccount } from './integrated-account';
import { IntegrationCard } from './integration-card';
import { IntegrationDrawer } from './integration-drawer';
import { RevokeQuestion } from './revoke-question';
import { SplunkCredentialsStep, SplunkStepHeader, SplunkTargetsStep } from './splunk-steps';
import { chooseIndex, EMPTY_TARGETS, type SplunkTargets } from './splunk-targets';
import { SplunkUserLogs } from './splunk-user-logs';

/**
 * Splunk, which is connected in two steps.
 *
 * Step one is the instance and its two tokens, which are saved before the
 * indexes can be read: the instance is only reachable once it holds them. Step
 * two chooses the index findings are written into, and optionally the one user
 * activity goes to. A connected instance shows what it points at and keeps the
 * user-log choices editable, since those are the only part worth changing
 * without connecting again.
 */
export function SplunkIntegration() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isStepTwo, setIsStepTwo] = useState(false);
  const [isEditingUserLogs, setIsEditingUserLogs] = useState(false);

  /* Only what has been changed here: everything else is read from the connection. */
  const [edits, setEdits] = useState<Partial<SplunkTargets>>({});

  const splunk = useQuery(splunkIntegrationOptions(selected?.id));

  const connection = splunk.data ?? null;
  const isConnected = Boolean(connection?.instance_url && connection?.vulnerability_index);

  const indexes = useQuery(splunkIndexesOptions(selected?.id, isConnected || isStepTwo));
  const indexOptions = indexes.data ?? [];

  const splunkForm = useForm<SplunkFormSchema>({
    resolver: zodResolver(buildSplunkSchema()),
    defaultValues: { instanceUrl: '', hecToken: '', apiToken: '' },
    mode: 'onChange',
  });

  /* What the connection says it writes where, which an edit here takes precedence over. */
  const connected: SplunkTargets = connection
    ? {
        vulnerabilityIndex: connection.vulnerability_index,
        sendUserLogs: connection.send_user_logs,
        userLogsIndex: connection.user_logs_index,
        logFrequencyHours: connection.log_frequency_hours,
      }
    : EMPTY_TARGETS;

  const targets: SplunkTargets = {
    sendUserLogs: edits.sendUserLogs ?? connected.sendUserLogs,
    logFrequencyHours: edits.logFrequencyHours ?? connected.logFrequencyHours,

    vulnerabilityIndex: chooseIndex(
      edits.vulnerabilityIndex ?? connected.vulnerabilityIndex,
      indexOptions,
      0
    ),

    userLogsIndex: chooseIndex(edits.userLogsIndex ?? connected.userLogsIndex, indexOptions, 1),
  };

  const refreshConnection = () =>
    queryClient.invalidateQueries({ queryKey: integrationKeys.splunk(selected?.id) });

  const send = (credentials: SplunkFormSchema, chosen: SplunkTargets) => {
    const details: SplunkIntegrationRequest = {
      instance_url: credentials.instanceUrl.trim().replace(/\/$/, ''),
      hec_token: credentials.hecToken.trim(),
      api_token: credentials.apiToken.trim(),
      vulnerability_index: chosen.vulnerabilityIndex,
      send_user_logs: chosen.sendUserLogs,
      user_logs_index: chosen.userLogsIndex,
      log_frequency_hours: chosen.logFrequencyHours,
    };

    return IntegrationService.setSplunkIntegration(Number(selected?.id), details);
  };

  /* The endpoint names the field it refused, which irene reports as "field - reason". */
  const reportRefusal = (error: unknown) => {
    const [field, messages] = Object.entries(getApiFieldErrors(error))[0] ?? [];

    akNotify.error(field && messages?.[0] ? `${field} - ${messages[0]}` : akMT('pleaseTryAgain'));
  };

  /*
    Step one saves the credentials and then reads the indexes through them, so
    the indexes answering is what admits the second step.
  */
  const saveAndProceed = useMutation({
    mutationFn: async (credentials: SplunkFormSchema) => {
      await send(credentials, targets);

      return queryClient.fetchQuery(splunkIndexesOptions(selected?.id, true));
    },

    onSuccess: (available) => {
      if (available.length === 0) {
        akNotify.error(akMT('splunk.errorFetchingIndexes'));

        return;
      }

      setIsStepTwo(true);
    },

    onError: reportRefusal,
  });

  const completeIntegration = useMutation({
    mutationFn: () => send(splunkForm.getValues(), targets),

    onSuccess: async () => {
      akNotify.success(akMT('splunkIntegrated'));
      setIsStepTwo(false);
      setIsDrawerOpen(false);

      await refreshConnection();
    },

    onError: reportRefusal,
  });

  /* A connected instance's credentials stay with the server, so its own copy is sent back. */
  const saveTargets = useMutation({
    mutationFn: (chosen: SplunkTargets) =>
      connection
        ? send(
            {
              instanceUrl: connection.instance_url,
              hecToken: connection.hec_token,
              apiToken: connection.api_token,
            },
            chosen
          )
        : Promise.reject(new Error('no connection')),

    onSuccess: async () => {
      setIsEditingUserLogs(false);

      await refreshConnection();
    },

    onError: reportRefusal,
  });

  const revoke = useMutation({
    mutationFn: () => IntegrationService.revokeSplunkIntegration(Number(selected?.id)),

    onSuccess: async () => {
      akNotify.success(akMT('splunk.willBeRevoked'));
      setIsAsking(false);
      setIsDrawerOpen(false);
      setEdits({});
      splunkForm.reset();

      await refreshConnection();
    },

    onError: () => {
      akNotify.error(akMT('pleaseTryAgain'));
    },
  });

  /* Shown while the connection is read as well, so the panel never opens on step one. */
  const showsConnection = isConnected || splunk.isPending;

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setIsAsking(false);
    setIsEditingUserLogs(false);

    if (!isConnected) {
      setIsStepTwo(false);
      setEdits({});
      splunkForm.reset();
    }
  };

  return (
    <Fragment>
      <IntegrationCard
        isLoading={splunk.isPending}
        data={{
          id: 'Splunk',
          title: akMT('splunk.title'),
          description: akMT('splunkIntegrationDesc'),
          logo: splunkIcon,
          isIntegrated: isConnected,
        }}
        onIntegrate={() => setIsDrawerOpen(true)}
      />

      <IntegrationDrawer
        isOpen={isDrawerOpen}
        title={isAsking ? akMT('confirmation') : akMT('splunkIntegration')}
        isSaving={completeIntegration.isPending || revoke.isPending}
        showDisconnect={showsConnection}
        /* Step one carries its own control, and so does the question. */
        noFooter={isAsking || (!isStepTwo && !showsConnection)}
        onSave={() => (showsConnection ? setIsAsking(true) : completeIntegration.mutate())}
        onClose={closeDrawer}
      >
        {isAsking && (
          <RevokeQuestion
            question={akMT('confirmBox.revokeSplunk')}
            isRevoking={revoke.isPending}
            onConfirm={() => revoke.mutate()}
            onCancel={() => setIsAsking(false)}
          />
        )}

        {!isAsking && !showsConnection && (
          <SplunkStepHeader isStepTwo={isStepTwo} onBack={() => setIsStepTwo(false)} />
        )}

        {!isAsking && showsConnection && (
          <div className="flex flex-col gap-2 p-3.5">
            <IntegratedAccount
              logo={splunkIcon}
              logoAlt={akMT('splunk.title')}
              hostUrl={connection?.instance_url ?? ''}
              propertyTitle={akMT('splunk.vulnIndex')}
              property={connection?.vulnerability_index ?? ''}
              isLoading={splunk.isPending}
            />

            {isConnected && (
              <SplunkUserLogs
                sendUserLogs={targets.sendUserLogs}
                indexes={indexOptions}
                userLogsIndex={targets.userLogsIndex}
                logFrequencyHours={targets.logFrequencyHours}
                showOptionalHeading={false}
                isEditing={isEditingUserLogs}
                isSaving={saveTargets.isPending}
                /* Taking effect as it is moved, as irene saves it straight away. */
                onToggleSendUserLogs={(sendUserLogs) => {
                  const chosen = { ...targets, sendUserLogs };

                  setEdits((current) => ({ ...current, sendUserLogs }));
                  saveTargets.mutate(chosen);
                }}
                onUserLogsIndexChange={(userLogsIndex) =>
                  setEdits((current) => ({ ...current, userLogsIndex }))
                }
                onLogFrequencyChange={(logFrequencyHours) =>
                  setEdits((current) => ({ ...current, logFrequencyHours }))
                }
                onEdit={() => setIsEditingUserLogs(true)}
                onSave={() => saveTargets.mutate(targets)}
              />
            )}
          </div>
        )}

        {!isAsking && !showsConnection && !isStepTwo && (
          <SplunkCredentialsStep
            form={splunkForm}
            isSaving={saveAndProceed.isPending}
            onSubmit={(credentials) => saveAndProceed.mutate(credentials)}
          />
        )}

        {!isAsking && !showsConnection && isStepTwo && (
          <SplunkTargetsStep
            targets={targets}
            indexes={indexOptions}
            onChange={(change) => setEdits((current) => ({ ...current, ...change }))}
          />
        )}
      </IntegrationDrawer>
    </Fragment>
  );
}

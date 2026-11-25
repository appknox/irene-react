import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';
import { useForm } from 'react-hook-form';

import { IntegrationService } from '@irene/api/services/integration';
import { akMT } from '@irene/translations/intl';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';
import slackIcon from '@irene/ui/images/slack-icon.png';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { integrationKeys, slackIntegrationOptions } from '@/queries/integration';

import {
  buildSlackSchema,
  SlackFormField,
  type SlackFormSchema,
} from '../schemas/integration-forms';

import { IntegratedAccount } from './integrated-account';
import { IntegrationCard } from './integration-card';
import { IntegrationDrawer } from './integration-drawer';
import { RevokeQuestion } from './revoke-question';

/**
 * Slack, which takes a channel and then the workspace's consent.
 *
 * Connecting records the channel first and leaves for Slack, since the consent
 * is what mints the token the channel is sent through. A connected channel can
 * be changed in place, which only writes the channel and stays on the panel.
 */
export function SlackIntegration() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAsking, setIsAsking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const slack = useQuery(slackIntegrationOptions(selected?.id));

  const connection = slack.data ?? null;
  const isConnected = Boolean(connection?.api_token && connection?.channel_id);

  const slackForm = useForm<SlackFormSchema>({
    resolver: zodResolver(buildSlackSchema()),
    values: { channelId: connection?.channel_id ?? '' },
    mode: 'onChange',
  });

  const refreshConnection = () =>
    queryClient.invalidateQueries({ queryKey: integrationKeys.slack(selected?.id) });

  const connect = useMutation({
    mutationFn: async ({ channelId }: SlackFormSchema) => {
      await IntegrationService.setSlackChannel(Number(selected?.id), channelId);

      return IntegrationService.getSlackRedirectUrl(Number(selected?.id));
    },

    /* Slack's own consent screen, which returns to this screen once it is answered. */
    onSuccess: (url) => {
      window.location.href = url;
    },

    onError: () => {
      akNotify.error(akMT('pleaseTryAgain'));
    },
  });

  const saveChannel = useMutation({
    mutationFn: ({ channelId }: SlackFormSchema) =>
      IntegrationService.setSlackChannel(Number(selected?.id), channelId),

    onSuccess: async () => {
      akNotify.success(akMT('slack.channelSaved'));
      setIsEditing(false);

      await refreshConnection();
    },

    onError: () => {
      akNotify.error(akMT('pleaseTryAgain'));
      setIsEditing(false);
    },
  });

  const revoke = useMutation({
    mutationFn: () => IntegrationService.revokeSlackIntegration(Number(selected?.id)),

    onSuccess: async () => {
      akNotify.success(akMT('slack.willBeRevoked'));
      setIsAsking(false);
      setIsDrawerOpen(false);

      await refreshConnection();
    },

    onError: () => {
      akNotify.error(akMT('pleaseTryAgain'));
    },
  });

  /* The connection is shown while it is read as well, so the panel never opens on an empty form. */
  const showsConnection = (isConnected || slack.isPending) && !isEditing;

  const closeDrawer = () => {
    setIsDrawerOpen(false);
    setIsAsking(false);
    setIsEditing(false);
  };

  return (
    <Fragment>
      <IntegrationCard
        isLoading={slack.isPending}
        data={{
          id: 'Slack',
          title: akMT('slack.title'),
          description: akMT('slackIntegrationDesc'),
          logo: slackIcon,
          isIntegrated: isConnected,
        }}
        onIntegrate={() => setIsDrawerOpen(true)}
      />

      <IntegrationDrawer
        isOpen={isDrawerOpen}
        title={isAsking ? akMT('confirmation') : akMT('slackIntegration')}
        isSaving={connect.isPending || saveChannel.isPending || revoke.isPending}
        showDisconnect={showsConnection}
        isEditing={isEditing}
        noFooter={isAsking}
        onSave={() =>
          showsConnection
            ? setIsAsking(true)
            : void slackForm.handleSubmit((channel) => connect.mutate(channel))()
        }
        onEdit={() => void slackForm.handleSubmit((channel) => saveChannel.mutate(channel))()}
        onClose={closeDrawer}
      >
        {isAsking && (
          <RevokeQuestion
            question={akMT('confirmBox.revokeSlack')}
            isRevoking={revoke.isPending}
            onConfirm={() => revoke.mutate()}
            onCancel={() => setIsAsking(false)}
          />
        )}

        {!isAsking && showsConnection && (
          <div className="flex flex-col p-5.25">
            <IntegratedAccount
              logo={slackIcon}
              logoAlt={akMT('slack.title')}
              propertyTitle={akMT('slack.channelId')}
              property={connection?.channel_id ?? ''}
              isLoading={slack.isPending}
              onEdit={() => setIsEditing(true)}
            />
          </div>
        )}

        {!isAsking && !showsConnection && (
          <AkFormProvider {...slackForm}>
            <form
              noValidate
              className="
                m-5.25 flex min-w-87.5 max-w-100 flex-col gap-2 rounded-xs border border-border
                p-3.5
              "
            >
              <SlackFormField name="channelId" label={akMT('slack.channelId')}>
                <AkInput placeholder={akMT('slack.enterChannelId')} data-test-slack-channel-id />
              </SlackFormField>
            </form>
          </AkFormProvider>
        )}
      </IntegrationDrawer>
    </Fragment>
  );
}

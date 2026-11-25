import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';

import { IntegrationService } from '@irene/api/services/integration';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';
import githubIcon from '@irene/ui/images/github-icon.png';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { githubIntegrationOptions, integrationKeys } from '@/queries/integration';

import { IntegratedAccount } from './integrated-account';
import { IntegrationCard } from './integration-card';
import { IntegrationDrawer } from './integration-drawer';

/**
 * GitHub, which the organization connects by consenting at GitHub itself.
 *
 * Connecting leaves this application: the card asks the API where to send the
 * account and the browser goes there, returning to this screen once GitHub has
 * answered. A connected account is managed in the panel, which only offers the
 * way to revoke it, since there is nothing else to change.
 */
export function GithubIntegration() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAsking, setIsAsking] = useState(false);

  const github = useQuery(githubIntegrationOptions(selected?.id));
  const integratedUser = github.data?.integratedUser ?? null;

  const connect = useMutation({
    mutationFn: () => IntegrationService.getGithubRedirectUrl(Number(selected?.id)),

    /* GitHub's own consent screen, which returns to this screen when it is answered. */
    onSuccess: (url) => {
      window.location.href = url;
    },

    onError: () => {
      akNotify.error(akMT('githubErrorIntegration'));
    },
  });

  const revoke = useMutation({
    mutationFn: () => IntegrationService.revokeGithubIntegration(Number(selected?.id)),

    onSuccess: async () => {
      akNotify.success(akMT('githubWillBeRevoked'));
      setIsAsking(false);
      setIsDrawerOpen(false);

      await queryClient.invalidateQueries({ queryKey: integrationKeys.github(selected?.id) });
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  const closeDrawer = () => {
    setIsAsking(false);
    setIsDrawerOpen(false);
  };

  return (
    <Fragment>
      <IntegrationCard
        isLoading={github.isPending}
        data={{
          id: 'Github',
          title: akMT('github'),
          description: akMT('githubIntegrationDesc'),
          logo: githubIcon,
          isIntegrated: integratedUser !== null,
        }}
        onIntegrate={() => (integratedUser ? setIsDrawerOpen(true) : connect.mutate())}
      />

      <IntegrationDrawer
        isOpen={isDrawerOpen}
        title={isAsking ? akMT('confirmation') : akMT('githubIntegration')}
        isSaving={connect.isPending}
        showDisconnect={integratedUser !== null}
        onSave={() => (integratedUser ? setIsAsking(true) : connect.mutate())}
        onClose={closeDrawer}
      >
        {isAsking && (
          <div className="m-5.25 flex flex-col p-3.5">
            <AkTypography data-test-github-revoke-question>
              {akMT('confirmBox.revokeGithub')}
            </AkTypography>

            <div className="flex gap-2.75 pt-7">
              <AkButton
                loading={revoke.isPending}
                onClick={() => revoke.mutate()}
                data-test-github-revoke-confirm
              >
                {akMT('yesDisconnect')}
              </AkButton>

              <AkButton
                variant="outlined"
                color="neutral"
                onClick={() => setIsAsking(false)}
                data-test-github-revoke-cancel
              >
                {akMT('cancel')}
              </AkButton>
            </div>
          </div>
        )}

        {!isAsking && integratedUser && (
          <div className="flex flex-col p-5.25">
            <IntegratedAccount
              logo={githubIcon}
              logoAlt={akMT('github')}
              hostUrl="https://github.com"
              propertyTitle={akMT('username')}
              property={integratedUser.login}
            />
          </div>
        )}
      </IntegrationDrawer>
    </Fragment>
  );
}

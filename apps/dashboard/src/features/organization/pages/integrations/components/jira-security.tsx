import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useEffect, useState } from 'react';

import { IntegrationService } from '@irene/api/services/integration';
import { getApiErrorMessage } from '@irene/api/utils/errors';
import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';
import { AkToggle } from '@irene/ui/ak-toggle';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { integrationKeys, jiraSecurityOptions } from '@/queries/integration';

import { JiraSecurityStatusBand, JiraSecurityStep } from './jira-security-steps';
import { RevokeQuestion } from './revoke-question';
import { useCopyFeedback } from './use-copy-feedback';

/** A Jira site is a subdomain of atlassian.net, which the deep link is built from. */
const JIRA_SITE_PATTERN = /^[a-z0-9][a-z0-9-]*\.atlassian\.net$/i;

/*
  Where Jira's marketplace listing for the app is.

  irene reads this from its own deployment variable and drops the install step
  when it is unset. No key is registered for it here, so the step is left out
  the same way: an administrator who has installed the app simply moves on.
*/
const INSTALL_URL = '';

/** The site address with the scheme and any path taken off, which is what Jira is keyed by. */
const normalizeSite = (site: string) =>
  site
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/\/.*$/, '');

/**
 * Jira Cloud Security, which Jira's own side of the connection completes.
 *
 * The panel walks an administrator through it: install the app where this
 * deployment links to it, name the Jira site, mint the shared secret, and
 * carry it into Jira. The secret is answered once and never read back, so it
 * is held only until the panel is left.
 */
export function JiraSecurity() {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const [site, setSite] = useState('');
  const [isSiteTouched, setIsSiteTouched] = useState(false);
  const [secret, setSecret] = useState('');
  const [question, setQuestion] = useState<'regenerate' | 'disconnect' | null>(null);

  const { hasCopied, copy } = useCopyFeedback();

  const jiraSecurity = useQuery(jiraSecurityOptions(selected?.id));

  const status = jiraSecurity.data?.status ?? 'not_connected';
  const configurePath = jiraSecurity.data?.configure_path ?? null;
  const isConnected = status === 'connected';

  const refreshStatus = () =>
    queryClient.invalidateQueries({ queryKey: integrationKeys.jiraSecurity(selected?.id) });

  /* Jira is configured in another tab, so returning to this one reads the state again. */
  useEffect(() => {
    const read = () => void refreshStatus();

    window.addEventListener('focus', read);

    return () => window.removeEventListener('focus', read);
  });

  /* Answered once: a connection Jira has completed has no secret left to show. */
  const shownSecret = isConnected ? '' : secret;

  const normalizedSite = normalizeSite(site);
  const isSiteValid = JIRA_SITE_PATTERN.test(normalizedSite);
  const showsSiteError = isSiteTouched && site !== '' && !isSiteValid;

  const configureUrl =
    isSiteValid && configurePath ? `https://${normalizedSite}${configurePath}` : '';

  const generateSecret = useMutation({
    mutationFn: () => IntegrationService.generateJiraSecuritySecret(Number(selected?.id)),

    onSuccess: async (generated) => {
      setSecret(generated);
      setQuestion(null);

      await refreshStatus();
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  const setAutoPush = useMutation({
    mutationFn: (autoPush: boolean) =>
      IntegrationService.setJiraSecurityAutoPush(Number(selected?.id), autoPush),

    onSuccess: refreshStatus,

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  const disconnect = useMutation({
    mutationFn: () => IntegrationService.revokeJiraSecurity(Number(selected?.id)),

    onSuccess: async () => {
      setQuestion(null);
      setSecret('');

      await refreshStatus();
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    },
  });

  const copySecret = async () => {
    if (await copy(shownSecret)) {
      akNotify.success(akMT('jiraSecurity.copied'));

      return;
    }

    akNotify.error(akMT('jiraSecurity.copyFailed'));
  };

  if (question === 'regenerate') {
    return (
      <RevokeQuestion
        question={akMT('jiraSecurity.regenerateWarning')}
        isRevoking={generateSecret.isPending}
        onConfirm={() => generateSecret.mutate()}
        onCancel={() => setQuestion(null)}
      />
    );
  }

  if (question === 'disconnect') {
    return (
      <RevokeQuestion
        question={akMT('jiraSecurity.disconnectWarning')}
        isRevoking={disconnect.isPending}
        onConfirm={() => disconnect.mutate()}
        onCancel={() => setQuestion(null)}
      />
    );
  }

  const showsInstallStep = !isConnected && INSTALL_URL !== '';
  const siteStepNumber = showsInstallStep ? 2 : 1;

  return (
    <div className="flex w-112.5 flex-col" data-test-jira-security>
      <JiraSecurityStatusBand status={status} />

      {/* The steps sit in a band of their own, as irene pads them apart from the status above. */}
      <div className="flex flex-col gap-3.5 p-4.5">
        {isConnected && (
          <Fragment>
            {jiraSecurity.data?.connected_on && (
              <div className="flex items-center gap-1">
                <AkIcon name="material-symbols:info" className="size-4 text-secondary" />

                <AkTypography
                  variant="body2"
                  color="textSecondary"
                  data-test-jira-security-connected-on
                >
                  {`${akMT('jiraSecurity.connectedOn')} ${formatDateTime(jiraSecurity.data.connected_on)}`}
                </AkTypography>
              </div>
            )}

            {/*
            Offered only once connected: with nothing to push to the choice is
            meaningless, and the API has no connection to set it on.
          */}
            <div className="flex w-full flex-col gap-1.5">
              <div className="flex w-full items-center justify-between">
                <AkLabel htmlFor="jira-security-auto-push" className="font-medium">
                  {akMT('jiraSecurity.autoPush')}
                </AkLabel>

                <AkToggle
                  id="jira-security-auto-push"
                  size="small"
                  checked={jiraSecurity.data?.auto_push ?? false}
                  disabled={setAutoPush.isPending}
                  onCheckedChange={(checked) => setAutoPush.mutate(checked)}
                  data-test-jira-security-auto-push
                />
              </div>

              <AkTypography variant="body2" color="textSecondary">
                {akMT('jiraSecurity.autoPushDesc')}
              </AkTypography>
            </div>

            <div className="flex gap-2.75">
              <AkButton
                variant="outlined"
                onClick={() => setQuestion('disconnect')}
                data-test-jira-security-disconnect
              >
                {akMT('disconnect')}
              </AkButton>

              <AkButton
                variant="outlined"
                color="neutral"
                onClick={() => setQuestion('regenerate')}
                data-test-jira-security-regenerate
              >
                {akMT('jiraSecurity.regenerate')}
              </AkButton>
            </div>
          </Fragment>
        )}

        {!isConnected && (
          <Fragment>
            {showsInstallStep && (
              <JiraSecurityStep
                number={1}
                title={akMT('jiraSecurity.step1')}
                help={akMT('jiraSecurity.step1Help')}
              >
                <AkButton
                  variant="outlined"
                  className="mt-1.75 self-start"
                  onClick={() => window.open(INSTALL_URL, '_blank', 'noopener,noreferrer')}
                  data-test-jira-security-install
                >
                  {akMT('jiraSecurity.installApp')}
                </AkButton>
              </JiraSecurityStep>
            )}

            {/*
            The site address is asked for before the secret, so the administrator
            can go straight into Jira as soon as they have one.
          */}
            <JiraSecurityStep
              number={siteStepNumber}
              title={akMT('jiraSecurity.siteLabel')}
              help={akMT('jiraSecurity.siteHelp')}
            >
              <AkInput
                value={site}
                placeholder={akMT('jiraSecurity.sitePlaceholder')}
                aria-invalid={showsSiteError}
                aria-label={akMT('jiraSecurity.siteLabel')}
                onChange={(event) => {
                  setSite(event.target.value);
                  setIsSiteTouched(true);
                }}
                data-test-jira-security-site
              />

              {showsSiteError && (
                <AkTypography variant="body3" color="error" data-test-jira-security-site-error>
                  {akMT('jiraSecurity.invalidSite')}
                </AkTypography>
              )}

              {/* Where the deployment has no configure path, the steps are given in words instead. */}
              {!configurePath && (
                <AkTypography
                  variant="body2"
                  color="textSecondary"
                  data-test-jira-security-manual-steps
                >
                  {akMT('jiraSecurity.manualSteps')}
                </AkTypography>
              )}

              {shownSecret === '' && (
                <AkButton
                  className="mt-1.75 w-full"
                  loading={generateSecret.isPending}
                  disabled={!isSiteValid}
                  onClick={() => generateSecret.mutate()}
                  data-test-jira-security-generate
                >
                  {akMT('jiraSecurity.generateSecret')}
                </AkButton>
              )}
            </JiraSecurityStep>

            {shownSecret !== '' && (
              <JiraSecurityStep
                number={siteStepNumber + 1}
                title={akMT('jiraSecurity.secretHeading')}
                help={akMT('jiraSecurity.secretShownOnce')}
              >
                <AkInput
                  readOnly
                  value={shownSecret}
                  aria-label={akMT('jiraSecurity.secretHeading')}
                  data-test-jira-security-secret
                  rightAdornment={
                    <AkIconButton
                      onClick={() => void copySecret()}
                      aria-label={akMT('jiraSecurity.copy')}
                      title={akMT('jiraSecurity.copy')}
                      data-test-jira-security-copy
                    >
                      <AkIcon
                        name={
                          hasCopied
                            ? 'material-symbols:check'
                            : 'material-symbols:content-copy-outline'
                        }
                        className={hasCopied ? 'text-success' : undefined}
                      />
                    </AkIconButton>
                  }
                />

                {configurePath && (
                  <AkButton
                    className="mt-1.75 w-full"
                    disabled={configureUrl === ''}
                    onClick={() => window.open(configureUrl, '_blank', 'noopener,noreferrer')}
                    data-test-jira-security-continue
                  >
                    {akMT('jiraSecurity.continueToJira')}
                  </AkButton>
                )}

                <AkButton
                  variant="outlined"
                  color="neutral"
                  className="mt-1.75 w-full"
                  loading={generateSecret.isPending}
                  onClick={() => setQuestion('regenerate')}
                  data-test-jira-security-regenerate
                >
                  {akMT('jiraSecurity.regenerate')}
                </AkButton>
              </JiraSecurityStep>
            )}
          </Fragment>
        )}
      </div>
    </div>
  );
}

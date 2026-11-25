import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Fragment, useState } from 'react';

import {
  OrganizationService,
  type ApiOrganizationAiFeatureSettings,
} from '@irene/api/services/organization';

import { organizationStore } from '@irene/api/stores/organization';
import { getApiErrorMessage, unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkSpinner } from '@irene/ui/ak-spinner';
import { AkToggle } from '@irene/ui/ak-toggle';
import { AkTypography } from '@irene/ui/ak-typography';
import { akNotify } from '@irene/ui/notify';

import { PoweredByAiChip, PoweredByAiDrawer } from '@/components/powered-by-ai';
import { useOrganization } from '@/hooks/use-organization';
import { organizationAiFeatureSettingsOptions, organizationKeys } from '@/queries/organization';

import { buildAiFeatures, type AiFeature, type AiFeatureKey } from './features';

/** How many rows stand in while the settings are read. */
const PLACEHOLDER_ROWS = [1, 2];

/**
 * The organization's AI features, each switched on or off on its own.
 *
 * A feature that explains what it does with the account's data asks before it
 * is turned: the explanation opens, and the switch moves once it is answered.
 * One with nothing to explain turns straight away, as irene turns KnoxIQ.
 */
export function OrganizationAiPoweredFeaturesPage() {
  const queryClient = useQueryClient();
  const organization = useOrganization();

  /* Which feature is being asked about, and what the answer would make it. */
  const [asking, setAsking] = useState<{ key: AiFeatureKey; turningOn: boolean } | null>(null);

  const settings = useQuery(organizationAiFeatureSettingsOptions(organization.selected?.id));

  const turn = useMutation({
    mutationFn: (next: ApiOrganizationAiFeatureSettings) =>
      OrganizationService.setOrganizationAiFeatureSettings(organization.selectedId(), next),

    onSuccess: async (updated) => {
      akNotify.success(akMT('statusUpdatedSuccessfully'));
      setAsking(null);

      queryClient.setQueryData(organizationKeys.aiFeatures(organization.selected?.id), updated);
    },

    onError: unlessRateLimited((error) => {
      setAsking(null);
      akNotify.error(getApiErrorMessage(error) ?? akMT('pleaseTryAgain'));
    }),
  });

  const entitlements = organizationStore.getState().aiFeatures();
  const withheld = organizationStore.getState().upsellStatus();
  const features = buildAiFeatures(entitlements, withheld);

  /* Every feature is sent, so the one being turned is set on what the rest already are. */
  const turnFeature = (key: AiFeatureKey, isOn: boolean) => {
    if (!settings.data) {
      return;
    }

    turn.mutate({ ...settings.data, [key]: isOn });
  };

  const askOrTurn = (feature: AiFeature, isOn: boolean) => {
    if (feature.sections === null) {
      turnFeature(feature.key, isOn);

      return;
    }

    setAsking({ key: feature.key, turningOn: isOn });
  };

  const asked = features.find((feature) => feature.key === asking?.key);
  const isLoading = settings.isPending;

  return (
    <div
      className="flex w-full flex-col border border-t-0 border-border bg-background"
      data-test-ai-powered-features
    >
      {isLoading &&
        PLACEHOLDER_ROWS.map((row) => (
          <Fragment key={row}>
            {row > 1 && <AkDivider color="dark" className="my-3.5" />}

            <div className="flex w-full flex-col gap-1.75 p-4" data-test-ai-feature-placeholder>
              <AkSkeleton width="8rem" height="1.5rem" />

              <AkSkeleton width="14rem" height="1.25rem" />

              <AkSkeleton width="60%" height="1rem" />
            </div>
          </Fragment>
        ))}

      {!isLoading &&
        features.map((feature, index) => {
          const isOn = Boolean(settings.data?.[feature.key]);

          /* Only the feature being turned waits; the others stay usable, as irene leaves them. */
          const isTurning = turn.isPending && turn.variables?.[feature.key] !== isOn;

          return (
            <Fragment key={feature.key}>
              {/* irene rules between the rows, and not above the first. */}
              {index > 0 && <AkDivider color="dark" className="my-3.5" />}

              <div className="flex w-full flex-col gap-1.75 p-4" data-test-ai-feature={feature.key}>
                {feature.sections === null ? (
                  <PoweredByAiChip className="self-start" />
                ) : (
                  <PoweredByAiDrawer sections={feature.sections} />
                )}

                <div className="flex w-full items-center justify-between gap-3.5">
                  <AkTypography fontWeight="medium" data-test-ai-feature-header>
                    {feature.header}
                  </AkTypography>

                  <div className="flex items-center gap-1.75">
                    <AkToggle
                      size="small"
                      checked={isOn}
                      disabled={!feature.isEntitled || isTurning}
                      onCheckedChange={(checked) => askOrTurn(feature, checked)}
                      aria-label={feature.header}
                      data-test-ai-feature-toggle
                    />

                    {isTurning && <AkSpinner className="text-primary" />}
                  </div>
                </div>

                <AkTypography
                  variant="body2"
                  color="textSecondary"
                  className="w-8/12"
                  data-test-ai-feature-description
                >
                  {feature.description}
                </AkTypography>
              </div>
            </Fragment>
          );
        })}

      {/*
        Held open by this screen rather than by its own chip: it is opened by
        the switch, and carries the answer that moves it.
      */}
      {asked?.sections && asking && (
        <PoweredByAiDrawer
          sections={asked.sections}
          open
          onOpenChange={(isOpen) => !isOpen && setAsking(null)}
          action={{
            label: asking.turningOn ? akMT('yesTurnOn') : akMT('yesTurnOff'),
            isWorking: turn.isPending,
            onConfirm: () => turnFeature(asking.key, asking.turningOn),
          }}
        />
      )}
    </div>
  );
}

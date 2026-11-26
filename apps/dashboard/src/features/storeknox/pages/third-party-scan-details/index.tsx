import { useQuery } from '@tanstack/react-query';
import { getRouteApi } from '@tanstack/react-router';

import {
  skThirdPartyAppOptions,
  skThirdPartyConfigOptions,
} from '@/features/storeknox/queries/third-party';

import { PageWrapper } from '@/components/page-wrapper';
import { resolveThirdPartyScope } from '@/features/storeknox/utils/third-party';

import { AssessmentError } from './components/assessment-error';
import { DetailsHeader } from './components/details-header';
import { RiskSection } from './components/risk-section';
import { TechnicalDetails } from './components/technical-details';

const routeApi = getRouteApi('/_authenticated/dashboard_/storeknox/third-party-scans/$packageName');

/**
 * One third-party app's risk assessment: the header with its version select, the risk score, and
 * either the technical details (when the app has a score) or the assessment error card.
 *
 * The store and region are the ones the link carries when the organization opted into them, else
 * the first it did (`resolveThirdPartyScope`), and the version is the link's `tp_version` when the
 * app has been scanned at it, else the app's own. The route loads the config and the app, so
 * neither is missing when this renders.
 */
export function ThirdPartyScanDetailsPage() {
  const { packageName } = routeApi.useParams();
  const search = routeApi.useSearch();
  const { data: config } = useQuery(skThirdPartyConfigOptions());

  const { store, region } = resolveThirdPartyScope(config, {
    store: search.tp_store,
    region: search.tp_region,
  });

  const { data: app } = useQuery(
    skThirdPartyAppOptions({ q: packageName, store, region, version: search.tp_version })
  );

  if (!app) {
    return null;
  }

  const selectedVersion =
    search.tp_version && app.versions.includes(search.tp_version) ? search.tp_version : app.version;

  return (
    <PageWrapper contentWidth="standard" data-test-sk-third-party-details>
      <div className="flex w-full flex-col gap-2">
        <DetailsHeader app={app} region={region} selectedVersion={selectedVersion} />

        <RiskSection app={app} />

        {app.score === null ? <AssessmentError /> : <TechnicalDetails findings={app.findings} />}
      </div>
    </PageWrapper>
  );
}

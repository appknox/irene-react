import { useSuspenseQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkTabs, AkTabsContent, AkTabsList, AkTabsTrigger } from '@irene/ui/ak-tabs';

import { useOrganization } from '@/hooks/use-organization';
import { publicApiSchemaOptions } from '@/queries/public-api';

import { SwaggerPanel } from './components/swagger-panel';

/* The only tab. irene keeps a Schemas tab beside it, commented out. */
const ENDPOINTS_TAB = 'apis';

/**
 * The documentation for the published API.
 *
 * Swagger UI renders a document whole, so the heading and the operations are
 * drawn as two panels, each given the document with the other part emptied.
 *
 * It suspends rather than drawing its own placeholder, so the route or the
 * host holds the space until the page is ready.
 */
export function PublicApiDocsPage() {
  const { me } = useOrganization();
  const { data: schema } = useSuspenseQuery(publicApiSchemaOptions());

  /* Swagger UI reloads whenever the object changes, so both are held across renders. */
  const heading = useMemo(() => ({ ...schema, paths: {}, components: {} }), [schema]);
  const operations = useMemo(() => ({ ...schema, info: {} }), [schema]);

  return (
    <div className="relative flex w-full flex-col pt-2.5" data-test-public-api-docs>
      {/* Lined up with the title Swagger UI draws in the panel below. */}
      {(me?.is_owner || me?.is_admin) && (
        <AkButton asChild className="absolute top-1.5 right-0">
          <a
            href="/dashboard/organization/settings/service-account"
            target="_blank"
            rel="noopener noreferrer"
            data-test-public-api-docs-service-account-link
          >
            {akMT('goToServiceAccounts')}
          </a>
        </AkButton>
      )}

      <SwaggerPanel className="swagger-ui-description" spec={heading} />

      <AkTabs value={ENDPOINTS_TAB} className="gap-0">
        {/* The offset cancels the padding, so the stuck row sits flush with the top. */}
        <AkTabsList className="sticky -top-3.5 z-10 w-full bg-background pt-3.5">
          <AkTabsTrigger value={ENDPOINTS_TAB}>{akMT('apiEndpoints')}</AkTabsTrigger>
        </AkTabsList>

        <AkTabsContent value={ENDPOINTS_TAB}>
          <SwaggerPanel className="swagger-ui-apis-container" spec={operations} />
        </AkTabsContent>
      </AkTabs>
    </div>
  );
}

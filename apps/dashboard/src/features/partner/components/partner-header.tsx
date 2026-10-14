import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';

import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';

import { useOrganization } from '@/hooks/use-organization';
import { partnerOptions } from '@/queries/partner';

/**
 * The band above every partner screen: whose dashboard it is, and its tabs.
 *
 * The partner screens sit in the dashboard's layout, so this is what tells an
 * account it is looking at a client's work rather than its own. Analytics is
 * sold on top of the partner dashboard, so it is offered only to a partner
 * entitled to it.
 */
export function PartnerHeader() {
  const organization = useOrganization();
  const { data: partner } = useQuery(partnerOptions(organization.selectedId()));

  const tabs = [
    { id: 'clients', label: akMT('clients'), to: '/partner/clients' },

    partner?.access.view_analytics && {
      id: 'analytics',
      label: akMT('analytics'),
      to: '/partner/analytics',
    },
  ] as const;

  return (
    <div className="flex justify-between bg-neutral-100" data-test-partner-header>
      <div className="flex flex-col items-start justify-center p-6">
        <AkTypography variant="h6" fontWeight="bold" data-test-partner-header-title>
          {akMT('partnerDashboard')}
        </AkTypography>

        <AkTypography variant="body2" data-test-partner-header-organization>
          {organization.selected?.name}
        </AkTypography>
      </div>

      <nav className="flex items-end justify-end pr-7" aria-label={akMT('partnerDashboard')}>
        {tabs.map((tab) =>
          tab ? (
            <Link
              key={tab.id}
              to={tab.to}
              className="
                border-b-3 border-transparent px-4 py-1.25 text-foreground
                data-[status=active]:border-primary
              "
              data-test-partner-header-tab={tab.id}
            >
              <AkTypography tag="span" variant="body2">
                {tab.label}
              </AkTypography>
            </Link>
          ) : null
        )}
      </nav>
    </div>
  );
}

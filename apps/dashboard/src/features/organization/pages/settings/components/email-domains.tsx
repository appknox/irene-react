import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';

import {
  OrganizationService,
  type ApiOrganizationEmailDomain,
} from '@irene/api/services/organization';

import { getApiErrorMessage } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkChip } from '@irene/ui/ak-chip';
import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';
import { akNotify } from '@irene/ui/notify';

import { useOrganization } from '@/hooks/use-organization';
import { organizationEmailDomainsOptions, organizationKeys } from '@/queries/organization';

import { SettingsPanel } from './settings-panel';

/**
 * The email domains an invitation may be sent to.
 *
 * Everyone in the organization reads them; only an owner adds or removes one,
 * which is what `isEditable` governs — the field and the chips' delete controls
 * are left out for everyone else, as irene leaves them out.
 *
 * @param props.isEditable - Whether this account may change the list.
 */
export function EmailDomainsPanel({ isEditable }: Readonly<{ isEditable: boolean }>) {
  const queryClient = useQueryClient();
  const { selected } = useOrganization();

  const [domainName, setDomainName] = useState('');

  const domains = useQuery(organizationEmailDomainsOptions(selected?.id));

  const refreshDomains = () =>
    queryClient.invalidateQueries({ queryKey: organizationKeys.emailDomains(selected?.id) });

  const add = useMutation({
    mutationFn: (name: string) =>
      OrganizationService.addOrganizationEmailDomain(Number(selected?.id), name),

    onSuccess: async (_added, name) => {
      akNotify.success(`${name} ${akMT('addedSuccessfully')}`);
      setDomainName('');

      await refreshDomains();
    },

    /* Named by the endpoint where it refuses one, which irene reports in place of the domain. */
    onError: (error, name) => {
      akNotify.error(getApiErrorMessage(error) ?? name);
    },
  });

  const remove = useMutation({
    mutationFn: (domain: ApiOrganizationEmailDomain) =>
      OrganizationService.deleteOrganizationEmailDomain(Number(selected?.id), domain.id),

    onSuccess: async () => {
      akNotify.success(akMT('domainDeleted'));

      await refreshDomains();
    },

    onError: (error) => {
      akNotify.error(getApiErrorMessage(error) ?? akMT('problemWhileDeletingDomain'));
    },
  });

  const isEmpty = domainName.trim() === '';

  return (
    <SettingsPanel
      title={akMT('emailDomainRestriction')}
      description={akMT('emailRestrictDesc')}
      className="max-w-150"
      testAttribute="org-email-domains"
    >
      {/* The field takes two thirds of the section, with the control beside it. */}
      {isEditable && (
        <div className="mt-5.25 flex items-end">
          <div className="flex w-8/12 flex-col gap-1.5">
            <AkLabel htmlFor="email-domain" className="text-base font-bold text-foreground">
              {akMT('addEmailDomains')}
            </AkLabel>

            <AkInput
              id="email-domain"
              value={domainName}
              placeholder="example.com"
              onChange={(event) => setDomainName(event.target.value)}
              data-test-org-email-domains-input
            />
          </div>

          <AkButton
            type="button"
            className="mx-3.5"
            disabled={isEmpty}
            loading={add.isPending}
            onClick={() => add.mutate(domainName.trim())}
            data-test-org-email-domains-save
          >
            {akMT('addDomain')}
          </AkButton>
        </div>
      )}

      <div className="mt-3.5 flex flex-wrap gap-2.75">
        {(domains.data?.items ?? []).map((domain) => (
          <AkChip
            key={domain.id}
            variant="outlined"
            label={domain.domain_name}
            onDelete={isEditable ? () => remove.mutate(domain) : undefined}
            data-test-org-email-domains-chip={domain.id}
          />
        ))}
      </div>
    </SettingsPanel>
  );
}

import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';
import OrgNamespaceEmpty from '@irene/ui/svgs/org-namespace-empty.svg?react';

interface NamespacesEmptyProps {
  isAdmin: boolean;
}

/**
 * Stands in for the table where the organization has claimed no namespaces.
 *
 * An admin is told there are none; anyone else is told none have been asked
 * for, since asking is what they would do about it.
 *
 * @param props.isAdmin - Whether this account administers the organization.
 */
export function NamespacesEmpty({ isAdmin }: Readonly<NamespacesEmptyProps>) {
  return (
    <div
      className="flex h-87.5 w-full flex-col items-center justify-center gap-3.5 bg-background"
      data-test-namespaces-empty
    >
      <OrgNamespaceEmpty aria-hidden="true" />

      <AkTypography variant="h5" data-test-namespaces-empty-title>
        {isAdmin ? akMT('noNamespace') : akMT('noNamespaceRequested')}
      </AkTypography>

      <AkTypography align="center" className="w-9/12" data-test-namespaces-empty-description>
        {akMT('noNamespaceDescription')}
      </AkTypography>
    </div>
  );
}

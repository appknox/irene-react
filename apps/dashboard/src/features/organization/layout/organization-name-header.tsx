import { useState, type ReactNode } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';

import { useOrganization } from '@/hooks/use-organization';

import { OrganizationNameModal } from './organization-name-modal';

/** What a screen puts beside the name, given the way to open the naming modal. */
interface OrganizationNameHeaderProps {
  action?: (controls: { openNameModal: () => void }) => ReactNode;
}

/**
 * The organization's name, or the control to give it one.
 *
 * Only an owner may name it, so anyone else is told why the control is closed
 * to them. What sits beside the name is the screen's own: the way through to
 * the settings on the organization screen, the way to rename it on the
 * settings screen. The naming modal is handed to it, since both open the same
 * one, as irene yields it.
 *
 * @param props.action - What to put beside the name.
 */
export function OrganizationNameHeader({ action }: Readonly<OrganizationNameHeaderProps>) {
  const { selected, me } = useOrganization();
  const [isNaming, setIsNaming] = useState(false);

  const name = selected?.name ?? '';

  /*
    The organization is loaded by the screen around this header, so until it is
    there, there is nothing to say about its name. Without this the header
    offers to name an organization that already has one.
  */
  const isLoading = selected === null;
  const isOwner = Boolean(me?.is_owner);

  /* irene names the standing in the refusal, so it says what this account is. */
  const standing = isOwner ? 'owner' : me?.is_admin ? 'admin' : 'member';

  return (
    <div
      className="
        flex items-center justify-between gap-3.5 rounded-xs border border-border bg-background
        p-3.5
      "
    >
      {isLoading ? (
        <div className="flex flex-col gap-1" data-test-org-name-loading>
          <AkTypography tag="span" color="textSecondary">
            {akMT('organizationName')}
          </AkTypography>

          <AkSkeleton width="12rem" height="1.5rem" />
        </div>
      ) : name === '' ? (
        <AkTooltip
          title={String(akMT('organizationNameAddNotPermitted', { type: standing }))}
          arrow
          side="bottom"
          align="start"
          disabled={isOwner}
          className="max-w-80 p-1.75 whitespace-normal"
        >
          <span className="inline-flex">
            {/* irene marks it as a space to fill: dashed, tinted, and flat rather than raised. */}
            <AkButton
              variant="outlined"
              disabled={!isOwner}
              onClick={() => setIsNaming(true)}
              className="
                border-dashed bg-primary/20 shadow-none
                disabled:border-foreground-disabled disabled:bg-neutral-100
                disabled:text-foreground-disabled
              "
              data-test-org-name-add
            >
              <AkIcon name="material-symbols:add" />

              {akMT('addOrgName')}
            </AkButton>
          </span>
        </AkTooltip>
      ) : (
        <div className="flex flex-col gap-1">
          <AkTypography tag="span" color="textSecondary" data-test-org-name-label>
            {akMT('organizationName')}
          </AkTypography>

          <AkTypography variant="subtitle1" data-test-org-name>
            {name}
          </AkTypography>
        </div>
      )}

      {action?.({ openNameModal: () => setIsNaming(true) })}

      <OrganizationNameModal
        isOpen={isNaming}
        currentName={name}
        onClose={() => setIsNaming(false)}
      />
    </div>
  );
}

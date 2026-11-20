import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';

import { useOrganization } from '@/hooks/use-organization';

/**
 * The action column's heading, with what the action does: an owner adds an
 * app straight to the inventory, anyone else asks an owner to.
 */
export function ResultActionHeader() {
  const { isOwner } = useOrganization();

  const info = isOwner()
    ? akMT('storeknox.actionHeaderInfoOwner')
    : akMT('storeknox.actionHeaderInfo');

  return (
    <span className="flex items-center justify-center gap-1">
      <AkTypography tag="span" fontWeight="medium">
        <AkMessageTranslate id="action" />
      </AkTypography>

      <AkTooltip
        side="bottom"
        arrow
        title={
          <AkTypography color="inherit" className="w-45 p-1.5 whitespace-normal">
            {info}
          </AkTypography>
        }
      >
        <span role="img" aria-label={info} tabIndex={0} className="inline-flex">
          <AkIcon name="material-symbols:info" className="size-4 text-foreground-muted" />
        </span>
      </AkTooltip>
    </span>
  );
}

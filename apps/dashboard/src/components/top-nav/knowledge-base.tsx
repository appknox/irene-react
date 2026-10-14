import { useStore } from 'zustand';

import { configurationStore } from '@irene/api/stores/configuration';
import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

import { openFreshdesk } from '@/scripts/freshdesk';

/**
 * Opens the support widget's knowledge base.
 *
 * Renders nothing where the deployment names no Freshdesk widget, since there
 * would be nothing to open.
 */
export function KnowledgeBase() {
  const widgetId = useStore(configurationStore, (config) => config.supportWidgetId());

  return widgetId ? (
    <AkButton
      variant="text"
      color="textPrimary"
      onClick={openFreshdesk}
      className="min-w-20 px-2.5 py-1.25 no-underline hover:no-underline focus-visible:no-underline"
      leftIcon={<AkIcon name="material-symbols:import-contacts" className="size-5.25" />}
      data-test-top-nav-knowledge-base
    >
      <AkTypography>
        <AkMessageTranslate id="knowledgeBase" />
      </AkTypography>
    </AkButton>
  ) : null;
}

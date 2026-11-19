import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import type { ApiSkFakeApp } from '@irene/api/services/storeknox';

import { PoweredByAiChip } from '@/components/powered-by-ai';
import { fakeAppConfidence } from '@/features/storeknox/utils/fake-app';

/**
 * The AI's overall finding: what the copy is suspected to be, why, and how confident it is.
 * Without a numeric final score there is nothing to state, so it renders nothing, as irene's does.
 *
 * The card is pale blue with its confidence in rose, as irene's; once the copy is ignored it turns
 * white and the confidence goes back to the body colour.
 *
 * @param props.fakeApp - The copy whose classification, justification and confidence are shown.
 * @param props.isIgnored - Whether the copy has been ignored, which drops the card's colours.
 */
export function FindingsCard({
  fakeApp,
  isIgnored,
}: Readonly<{ fakeApp: ApiSkFakeApp; isIgnored: boolean }>) {
  const confidence = fakeAppConfidence(fakeApp);

  if (confidence === null) {
    return null;
  }

  return (
    <section
      className={cn(
        'flex w-full flex-col gap-3 border border-border p-6',
        isIgnored ? 'bg-background' : 'bg-fake-app-finding'
      )}
      aria-label={akMT('storeknox.fakeApps.findings')}
      data-test-sk-fake-app-finding
    >
      <PoweredByAiChip label={akMT('storeknox.fakeApps.findings')} className="self-start" />

      <div className="flex w-full justify-between gap-2">
        <div className="flex max-w-155 flex-col items-start gap-2">
          <AkTypography fontWeight="bold">
            {fakeApp.ai_classification_label === 'brand_abuse'
              ? akMT('storeknox.fakeApps.suspectedBrandAbuse')
              : akMT('storeknox.fakeApps.suspectedFakeApps')}
          </AkTypography>

          <AkTypography>{fakeApp.ai_classification_justification}</AkTypography>
        </div>

        <div className="flex min-w-20 flex-col items-end gap-2">
          <AkTypography
            variant="h4"
            fontWeight="bold"
            color="inherit"
            className={cn(isIgnored ? 'text-foreground' : 'text-fake-app-confidence')}
          >
            {confidence}%
          </AkTypography>

          <AkTypography variant="body2" color="textSecondary">
            <AkMessageTranslate id="storeknox.fakeApps.confidence" />
          </AkTypography>
        </div>
      </div>
    </section>
  );
}

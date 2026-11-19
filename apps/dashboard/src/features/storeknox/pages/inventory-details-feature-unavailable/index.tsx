import { akMT } from '@irene/translations/intl';
import { AkTypography } from '@irene/ui/ak-typography';
import BrandAbuseAbsence from '@irene/ui/svgs/sox-brand-abuse-feature-absence.svg?react';
import MalwareAbsence from '@irene/ui/svgs/sox-malware-feature-absence.svg?react';

/** The checks StoreKnox offers but the organization has not bought. */
export type UnavailableFeature = 'brand-abuse' | 'malware-detected';

const FEATURES = {
  'brand-abuse': {
    Illustration: BrandAbuseAbsence,
    header: () => akMT('storeknox.brandAbuseFeatureUnavailableHeader'),
    description: () => akMT('storeknox.brandAbuseFeatureUnavailableSubText'),
  },
  'malware-detected': {
    Illustration: MalwareAbsence,
    header: () => akMT('storeknox.malwareDetectedFeatureUnavailableHeader'),
    description: () => akMT('storeknox.malwareDetectedFeatureUnavailableSubText'),
  },
} satisfies Record<UnavailableFeature, unknown>;

/** A preview of a check the organization has not bought, marked as unavailable. */
export function FeatureUnavailablePage({ feature }: Readonly<{ feature: UnavailableFeature }>) {
  const { Illustration, header, description } = FEATURES[feature];

  return (
    <div
      className="
        flex w-full flex-col items-center gap-8 border border-border bg-background px-6 py-15
      "
      data-test-sk-feature-unavailable={feature}
    >
      <Illustration aria-hidden="true" />

      <div className="flex max-w-121.25 flex-col items-center gap-1">
        <AkTypography variant="h5" align="center">
          {header()}
        </AkTypography>

        <AkTypography align="center">{description()}</AkTypography>
      </div>
    </div>
  );
}

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';
import { useWhitelabel } from '@/hooks/use-whitelabel';

/**
 * A link to the registration page, rendered when the frontend configuration
 * enables registration or points at an external sign-up URL. Reserves the space
 * while that configuration is loading, and renders nothing when it disables it.
 */
export function RegistrationFooter() {
  const { hasLoadedFrontendConfig, showRegistrationLink, registrationLink } = useWhitelabel();
  const registrationUrl = registrationLink || '/register';

  // Reserves one line of height while the configuration loads, so the card does not resize.
  if (!hasLoadedFrontendConfig) {
    return <div className="h-5.25" data-test-registration-footer-pending />;
  }

  // With registration disabled there is no footer, and the layout collapses the empty strip.
  if (!showRegistrationLink) {
    return null;
  }

  return (
    <AkTypography tag="p" className="text-center text-balance">
      <AkMessageTranslate id="dontHaveAccount" />

      <AkButton variant="text" color="primary" className="h-auto underline ml-1.5" noPadding>
        <a href={registrationUrl} data-test-registration-link>
          <AkMessageTranslate id="registerToday" />
        </a>
      </AkButton>
    </AkTypography>
  );
}

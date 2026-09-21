import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';
import { useWhitelabel } from '@/hooks/use-whitelabel';

/** A link to the registration page. The calling component renders it only when `showRegistrationLink` is true. */
export function RegistrationFooter() {
  const { registrationLink } = useWhitelabel();
  const registrationUrl = registrationLink || '/register';

  return (
    <span className="flex items-center justify-center gap-1.5">
      <AkTypography tag="span">
        <AkMessageTranslate id="dontHaveAccount" />
      </AkTypography>

      <AkButton variant="text" color="primary" className="underline" noPadding asChild>
        <a href={registrationUrl} className="h-fit" data-test-registration-link>
          <AkMessageTranslate id="registerToday" />
        </a>
      </AkButton>
    </span>
  );
}

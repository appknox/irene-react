import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';

export function RegistrationFooter() {
  return (
    <span className="flex items-center justify-center gap-1.5">
      <AkTypography tag="span">
        <AkMessageTranslate id="dontHaveAccount" />
      </AkTypography>

      <AkButton variant="text" color="primary" className="underline" noPadding asChild>
        <a href="/register" className="h-fit" data-test-registration-link>
          <AkMessageTranslate id="registerToday" />
        </a>
      </AkButton>
    </span>
  );
}

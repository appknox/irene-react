import {
  AkModal,
  AkModalBody,
  AkModalContent,
  AkModalHeader,
  AkModalTrigger,
} from '@irene/ui/ak-modal';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

function _WarningMark() {
  return (
    <span className="flex bg-warning-surface p-1.75 text-warning-strong" aria-hidden="true">
      <AkIcon name="material-symbols:warning" className="size-5" />
    </span>
  );
}

/**
 * The disclaimer under the search: that discovery is for the organization's
 * own apps, with the full wording a click away.
 */
export function Disclaimer() {
  return (
    <div
      className="mt-7.5 flex items-center border border-border bg-background"
      data-test-sk-discovery-disclaimer
    >
      <_WarningMark />

      <AkTypography fontWeight="medium" className="ml-3.5">
        <AkMessageTranslate id="storeknox.disclaimerLabel" />
      </AkTypography>

      <AkTypography className="ml-1.75">
        <AkMessageTranslate id="storeknox.disclaimerHeader" />
      </AkTypography>

      <AkModal>
        <AkModalTrigger asChild>
          <AkButton
            variant="text"
            color="textPrimary"
            className="ml-1.75 h-auto px-0 font-bold underline"
          >
            <AkMessageTranslate id="viewMore" />
          </AkButton>
        </AkModalTrigger>

        <AkModalContent className="max-w-150" data-test-sk-discovery-disclaimer-modal>
          <AkModalHeader
            title={akMT('storeknox.disclaimer')}
            closeLabel={akMT('close')}
            icon={<_WarningMark />}
          />

          <AkModalBody className="flex flex-col items-center p-5.25">
            <AkTypography variant="h5">
              <AkMessageTranslate id="storeknox.disclaimerHeader" />
            </AkTypography>

            <AkDivider color="dark" className="my-3.5" />

            <AkTypography>
              <AkMessageTranslate id="storeknox.disclaimerBody" />
            </AkTypography>
          </AkModalBody>
        </AkModalContent>
      </AkModal>
    </div>
  );
}

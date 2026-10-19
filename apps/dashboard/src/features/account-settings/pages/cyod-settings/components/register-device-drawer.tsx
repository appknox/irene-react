import { useMemo } from 'react';

import { getConfigValue } from '@irene/config';
import { MERCER_DOWNLOAD_URL } from '@irene/config/product';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDrawerBody, AkDrawerContent, AkDrawerHeader } from '@irene/ui/ak-drawer';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkTypography } from '@irene/ui/ak-typography';
import type { IconName } from '@irene/ui/icons/sets';

import { useCopyToClipboard } from '@/hooks/use-copy-to-clipboard';

import { CYODSetupStep } from './cyod-setup-step';

/** The Mercer build for each desktop, as irene offers them, with the note under each. */
const MERCER_DOWNLOADS: {
  id: string;
  icon: IconName;
  fileName: string;
  label: () => string;
  note: () => string;
}[] = [
  {
    id: 'mac',
    icon: 'mdi:apple',
    fileName: 'Mercer-x86_64.dmg',
    label: () => akMT('cyod.settings.downloadMercerMac'),
    note: () => akMT('cyod.settings.downloadMercerMacNote'),
  },
  {
    id: 'windows',
    icon: 'mdi:microsoft-windows',
    fileName: 'Mercer-windows-x64.exe',
    label: () => akMT('cyod.settings.downloadMercerWindows'),
    note: () => akMT('cyod.settings.downloadMercerWindowsNote'),
  },
  {
    id: 'linux',
    icon: 'mdi:linux',
    fileName: 'mercer.deb',
    label: () => akMT('cyod.settings.downloadMercerLinux'),
    note: () => akMT('cyod.settings.downloadMercerLinuxNote'),
  },
];

/**
 * Walks the user through registering a device with Mercer: install it, sign in
 * with a personal token and this server's address, register, and run.
 *
 * It is the drawer's content only; the page holds the drawer and its trigger.
 */
export function RegisterDeviceDrawer() {
  const serverUrl = useMemo(() => {
    return getConfigValue('IRENE_API_HOST') || window.location.origin;
  }, []);

  const { copy } = useCopyToClipboard();

  return (
    <AkDrawerContent aria-describedby={undefined} className="w-125" data-test-cyod-register-drawer>
      <AkDrawerHeader title={akMT('cyod.settings.registerADevice')} closeLabel={akMT('close')} />

      <AkDrawerBody className="flex flex-col gap-5.25">
        <div className="flex flex-col gap-1.75">
          <AkTypography variant="subtitle1">{akMT('cyod.settings.howToRegister')}</AkTypography>

          <AkTypography color="textSecondary">{akMT('cyod.settings.stepsIntro')}</AkTypography>
        </div>

        <ol className="flex flex-col gap-5.25">
          <CYODSetupStep number={1} title={akMT('cyod.settings.stepCertificate')}>
            <AkTypography variant="body2" color="textSecondary">
              {akMT('cyod.settings.stepCertificateNote')}
            </AkTypography>
          </CYODSetupStep>

          <CYODSetupStep number={2} title={akMT('cyod.settings.stepDownload')}>
            <div className="flex flex-wrap items-start gap-5.25">
              {MERCER_DOWNLOADS.map((download) => (
                <div key={download.id} className="flex w-31.25 flex-col items-start gap-0.75">
                  <AkButton asChild className="w-full" data-test-cyod-download={download.id}>
                    <a
                      href={`${MERCER_DOWNLOAD_URL}/${download.fileName}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <AkIcon name={download.icon} />

                      {download.label()}
                    </a>
                  </AkButton>

                  <AkTypography variant="body2" color="textSecondary" className="text-sm">
                    {download.note()}
                  </AkTypography>
                </div>
              ))}
            </div>

            <AkTypography variant="body2" color="textSecondary">
              {akMT('cyod.settings.stepDownloadNote')}
            </AkTypography>
          </CYODSetupStep>

          <CYODSetupStep number={3} title={akMT('cyod.settings.stepSignIn')}>
            <div
              className="
                flex w-full items-center justify-between gap-1.75 rounded-sm border
                border-divider-strong bg-background-subtle py-1 pr-1 pl-3
              "
            >
              <AkTypography className="font-mono text-sm break-all" data-test-cyod-server-url>
                {serverUrl}
              </AkTypography>

              <AkIconButton
                size="small"
                aria-label={akMT('copy')}
                className="text-primary"
                onClick={() => copy(serverUrl)}
                data-test-cyod-server-url-copy
              >
                <AkIcon name="material-symbols:content-copy" />
              </AkIconButton>
            </div>

            <AkTypography variant="body2" color="textSecondary" className="text-sm">
              {akMT('cyod.settings.stepSignInNote')}
            </AkTypography>
          </CYODSetupStep>

          <CYODSetupStep number={4} title={akMT('cyod.settings.stepRegister')} />

          <CYODSetupStep number={5} title={akMT('cyod.settings.stepRun')} />
        </ol>
      </AkDrawerBody>
    </AkDrawerContent>
  );
}

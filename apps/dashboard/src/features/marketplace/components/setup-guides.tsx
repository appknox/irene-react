import type { ReactNode } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkCodeBlock } from '@irene/ui/ak-code-block';
import { AkLink } from '@irene/ui/ak-link';
import { AkTypography } from '@irene/ui/ak-typography';
import appCenterBuildScript from '@irene/ui/images/appcenter_build_configuration__build_script.png';
import appCenterEnvironment from '@irene/ui/images/appcenter_build_configuration__environment.png';
import bitriseSecret from '@irene/ui/images/bitrise_workflow__add_secret.png';
import bitriseScriptStep from '@irene/ui/images/bitrise_workflow__script_step.png';
import { akNotify } from '@irene/ui/notify';

/*
  The guides are irene's, step for step and word for word. irene writes them in
  English only, outside its translations, and so do these.
*/

/** The guides a card can open, one per way of wiring Appknox in. */
export type SetupGuideId = 'cli' | 'app-center' | 'bitrise' | 'armorcode';

const DOWNLOAD_BINARY =
  'curl -L https://github.com/appknox/appknox-go/releases/latest/download/appknox-`uname -s`-x86_64 > /usr/local/bin/appknox && chmod +x /usr/local/bin/appknox';

const APP_CENTER_POST_BUILD = `if [ "$AGENT_JOBSTATUS" == "Succeeded" ]; then
  if [ "$APPCENTER_BRANCH" == "master" ];
    then
        curl -L https://github.com/appknox/appknox-go/releases/latest/download/appknox-\`uname -s\`-x86_64 > appknox && chmod +x appknox
        ./appknox upload $APPCENTER_OUTPUT_DIRECTORY/<binary_file_name>
        rm appknox
  else
      echo "Current branch is $APPCENTER_BRANCH"
  fi
fi`;

const BITRISE_SCRIPT_STEP = `- script:
  deps:
    brew:
    - name: curl
  inputs:
  - content: |-
      #!/usr/bin/env bash
      set -ex

      # upload to appknox
      curl -L https://github.com/appknox/appknox-go/releases/latest/download/appknox-\`uname -s\`-x86_64 > appknox && chmod +x appknox
      ./appknox upload $BITRISE_IPA_PATH
      rm ./appknox`;

/** A command or file the guide asks to be run or saved, copied with a toast to say so. */
function _Command({ code }: Readonly<{ code: string }>) {
  return (
    <AkCodeBlock
      code={code}
      copyLabel={akMT('copy')}
      className="mt-1.75"
      onCopy={() => akNotify.success(akMT('copiedToClipboard'))}
      onCopyError={() => akNotify.error(akMT('somethingWentWrong'))}
    />
  );
}

/** A link that leaves the guide, in a new tab so the steps stay open. */
function _GuideLink({ href, children }: Readonly<{ href: string; children: ReactNode }>) {
  return (
    <AkLink href={href} target="_blank" rel="noopener noreferrer" className="font-medium">
      {children}
    </AkLink>
  );
}

/** A name, variable or file the guide refers to, set apart from the prose. */
function _Code({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <code className="rounded-xs bg-background-subtle px-1 py-0.5 font-mono text-sm">
      {children}
    </code>
  );
}

/** One numbered step. */
function _Step({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <li className="pl-1">
      <AkTypography tag="div" variant="body2" className="flex flex-col gap-1">
        {children}
      </AkTypography>
    </li>
  );
}

/** A screenshot of the tool's own screen, at the width of the step. */
function _Screenshot({ src, alt }: Readonly<{ src: string; alt: string }>) {
  return <img src={src} alt={alt} className="mt-1.75 w-full rounded-sm border border-border" />;
}

/** A note under a command, in smaller type. */
function _Note({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <AkTypography variant="body2" color="textSecondary">
      {children}
    </AkTypography>
  );
}

/** The first step of every guide: a token the pipeline signs in with. */
function _GenerateTokenStep({ suffix }: Readonly<{ suffix?: string }>) {
  return (
    <_Step>
      <span>
        Generate a personal access token from{' '}
        <_GuideLink href="/dashboard/settings/developersettings">Developer Settings</_GuideLink>
        {suffix}
      </span>
    </_Step>
  );
}

/** Any pipeline that runs a shell: CircleCI, Bitbucket and GitLab. */
function _CliGuide() {
  return (
    <div className="flex flex-col gap-3.5">
      <ul className="flex list-disc flex-col gap-3.5 pl-5.25">
        <_GenerateTokenStep />

        <_Step>
          <span>
            Set environment variable <_Code>APPKNOX_ACCESS_TOKEN</_Code> with the personal token:
          </span>

          <_Command code="export APPKNOX_ACCESS_TOKEN=<personal access token>" />
        </_Step>

        <_Step>
          <span>Download the appknox binary:</span>

          <_Command code={DOWNLOAD_BINARY} />
        </_Step>

        <_Step>
          <span>Upload the app file to Appknox platform for scanning:</span>

          <_Command code="appknox upload <path to apk/ipa file>" />
        </_Step>

        <_Step>
          <span>
            Check if the automated scanner detected any vulnerability above (or equal to) the
            specified risk level, and optionally enforce a minimum health score:
          </span>

          <_Command code="appknox cicheck <file-id> --risk-threshold <low|medium|high|critical> --health-score-threshold <0-100>" />

          <_Note>
            <_Code>--health-score-threshold</_Code> (optional) — fails the check if the app&apos;s
            health score falls below the specified value (0–100).
          </_Note>
        </_Step>

        <_Step>
          <span>
            Tip: You can combine the upload and cicheck command as below which will list down all
            the vulnerabilities equal to or above the specified risk threshold and will exit with an
            error status.
          </span>

          <_Command code="appknox upload <path to apk/ipa file> | xargs appknox cicheck --risk-threshold <low|medium|high|critical> --health-score-threshold <0-100>" />
        </_Step>
      </ul>

      <AkTypography variant="body2">
        For more configuration options:{' '}
        <_GuideLink href="https://github.com/appknox/appknox-go">github.com/appknox-go</_GuideLink>
      </AkTypography>
    </div>
  );
}

/** Microsoft App Center, through a post-build script. */
function _AppCenterGuide() {
  return (
    <ol className="flex list-decimal flex-col gap-3.5 pl-5.25">
      <_GenerateTokenStep />

      <_Step>
        <span>
          Create a file <_Code>appcenter-post-build.sh</_Code> in your source code repository as per
          the{' '}
          <_GuideLink href="https://docs.microsoft.com/en-us/appcenter/build/custom/scripts/#post-build">
            build docs
          </_GuideLink>{' '}
          and add the content given below:
        </span>

        <_Command code={APP_CENTER_POST_BUILD} />

        <_Note>
          <_Code>binary_file_name</_Code> is the app bundle file (.apk for Android, .ipa for iOS)
        </_Note>
      </_Step>

      <_Step>
        <span>
          Once the file has been added to repo, in App Center goto{' '}
          <strong>Build Configuration &gt; Build &gt; Build scripts</strong> and verify{' '}
          <strong>Post-build</strong> is marked.
        </span>

        <_Screenshot src={appCenterBuildScript} alt="appcenter build config" />
      </_Step>

      <_Step>
        <span>
          Go to <strong>Build Configuration &gt; Environment variables</strong> and add{' '}
          <_Code>APPKNOX_ACCESS_TOKEN</_Code> environment variable with the value generated in step
          1.
        </span>

        <_Screenshot src={appCenterEnvironment} alt="appcenter environment config" />
      </_Step>
    </ol>
  );
}

/** Bitrise, through a script step in the workflow. */
function _BitriseGuide() {
  return (
    <div className="flex flex-col gap-3.5">
      <ol className="flex list-decimal flex-col gap-3.5 pl-5.25">
        <_GenerateTokenStep />

        <_Step>
          <span>
            In your project&apos;s Bitrise Workflow Editor, add secret environment variable{' '}
            <_Code>APPKNOX_ACCESS_TOKEN</_Code> with the value generated in step 1.
          </span>

          <_Screenshot src={bitriseSecret} alt="bitrise workflow editor: appknox secret" />
        </_Step>

        <_Step>
          <span>
            Add a <strong>script step</strong> as follows (either{' '}
            <_GuideLink href="https://devcenter.bitrise.io/tips-and-tricks/install-additional-tools/#adding-a-script-step-to-a-workflow">
              from UI
            </_GuideLink>{' '}
            or by editing{' '}
            <_GuideLink href="https://devcenter.bitrise.io/tips-and-tricks/install-additional-tools/#advanced-option-use-deps-in-bitriseyml">
              <_Code>bitrise.yml</_Code>
            </_GuideLink>{' '}
            file).{' '}
            <em>Make sure this is included after the app binary build step in the workflow.</em>{' '}
            This would upload your APK/IPA file to appknox dashboard and initiate the static scan.
          </span>

          <_Command code={BITRISE_SCRIPT_STEP} />

          <_Note>
            use <_Code>$BITRISE_APK_PATH</_Code> for Android
          </_Note>

          <_Screenshot src={bitriseScriptStep} alt="bitrise workflow editor: script step" />
        </_Step>
      </ol>

      <div className="flex flex-col gap-1 border-t border-divider pt-3.5">
        <AkTypography variant="body2">
          <em>Optional:</em> You can combine the upload and cicheck command as below which will list
          down all the vulnerabilities equal to or above the specified risk threshold in the
          workflow console and will exit with an error status.
        </AkTypography>

        <_Command code="appknox upload <path to apk/ipa file> | xargs appknox cicheck --risk-threshold <low|medium|high|critical>" />
      </div>
    </div>
  );
}

/** ArmorCode, which pulls findings with a token rather than running in a pipeline. */
function _ArmorCodeGuide() {
  return (
    <div className="flex flex-col gap-3.5">
      <ol className="flex list-decimal flex-col gap-3.5 pl-5.25">
        <_GenerateTokenStep suffix=" in the Appknox Dashboard." />

        <_Step>
          <span>
            Log in to your ArmorCode dashboard and navigate to{' '}
            <strong>Manage &gt; Security Tools &gt; Appknox</strong>.
          </span>
        </_Step>

        <_Step>
          <span>
            Click <strong>Add Configuration</strong> and enter the following details:
          </span>

          <ul className="list-disc pl-5.25">
            <li>
              <strong>Configuration Name:</strong> Provide a unique name.
            </li>

            <li>
              <strong>API Token:</strong> Paste the token generated in Step 1.
            </li>
          </ul>
        </_Step>

        <_Step>
          <span>
            After saving the configuration, the system will prompt you to map your projects. Select:
          </span>

          <ul className="list-disc pl-5.25">
            <li>
              <strong>Organization</strong> from Appknox
            </li>

            <li>
              <strong>Appknox Package</strong> you want to monitor
            </li>

            <li>
              <strong>ArmorCode Product</strong>, <strong>Subproduct</strong>, and{' '}
              <strong>Environment</strong> to link the findings
            </li>
          </ul>

          <span>
            Click <strong>Add Mapping</strong> to create multiple mappings if needed.
          </span>
        </_Step>

        <_Step>
          <span>
            Click <strong>Save</strong> to finalize your integration. Once a scan is complete in
            Appknox, findings will automatically sync and can be accessed by clicking the{' '}
            <strong>Scan ID</strong> or <strong>Result Details</strong> in ArmorCode.
          </span>
        </_Step>
      </ol>

      <AkTypography variant="body2" className="border-t border-divider pt-3.5">
        <em>Optional:</em> You can also configure alerting and sync settings. For more, see{' '}
        <_GuideLink href="https://support.armorcode.com/hc/en-us/articles/28507109043475-Configuring-Notifications-and-Settings-for-Security-Tools">
          ArmorCode Notification Settings
        </_GuideLink>
        .
      </AkTypography>
    </div>
  );
}

const GUIDES: Record<SetupGuideId, () => ReactNode> = {
  cli: _CliGuide,
  'app-center': _AppCenterGuide,
  bitrise: _BitriseGuide,
  armorcode: _ArmorCodeGuide,
};

/**
 * The steps that wire one tool to Appknox.
 *
 * @param props.guide - Which tool's steps.
 */
export function SetupGuide({ guide }: Readonly<{ guide: SetupGuideId }>) {
  const Guide = GUIDES[guide];

  return <Guide />;
}

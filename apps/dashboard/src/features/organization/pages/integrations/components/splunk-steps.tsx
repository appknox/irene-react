import { Fragment } from 'react';
import type { UseFormReturn } from 'react-hook-form';

import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkIconButton } from '@irene/ui/ak-icon-button';
import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';
import { AkLink } from '@irene/ui/ak-link';
import { AkTooltip } from '@irene/ui/ak-tooltip';
import { AkTypography } from '@irene/ui/ak-typography';

import { SplunkFormField, type SplunkFormSchema } from '../schemas/integration-forms';
import { SplunkUserLogs } from './splunk-user-logs';
import type { SplunkTargets } from './splunk-targets';

/** Splunk's own account of what an index is, which irene links out to from step two. */
const SPLUNK_INDEX_DOCS =
  'https://docs.splunk.com/Documentation/Splunk/9.4.0/Indexer/Aboutindexesandindexers#Indexes';

/**
 * Which step the panel is on, and the way back from the second.
 *
 * @param props.isStepTwo - Whether the second step is being shown.
 * @param props.onBack - Called to return to the first step.
 */
export function SplunkStepHeader({
  isStepTwo,
  onBack,
}: Readonly<{ isStepTwo: boolean; onBack: () => void }>) {
  if (!isStepTwo) {
    return (
      <div className="flex w-full items-end justify-between">
        <AkTypography variant="h5" className="mt-3.5 ml-5.25" data-test-splunk-step-title>
          {akMT('configureStep1')}
        </AkTypography>
      </div>
    );
  }

  return (
    <div className="flex w-full items-end justify-between">
      <div className="mt-3.5 ml-5.25 flex items-center gap-1.75">
        <AkIconButton
          onClick={onBack}
          aria-label={akMT('back')}
          title={akMT('back')}
          data-test-splunk-back
        >
          <AkIcon name="material-symbols:arrow-back" />
        </AkIconButton>

        <AkTypography variant="h5" data-test-splunk-step-title>
          {akMT('configureStep2')}
        </AkTypography>
      </div>

      <AkLink
        href={SPLUNK_INDEX_DOCS}
        target="_blank"
        rel="noopener noreferrer"
        className="mr-5.25 flex items-center gap-1.75"
      >
        {akMT('splunk.splunkIndexes')}

        <AkIcon name="material-symbols:open-in-new" className="size-4" />
      </AkLink>
    </div>
  );
}

/** One of step one's fields, each with what it is for behind an info mark. */
function SplunkCredentialField({
  name,
  label,
  help,
  placeholder,
  testAttribute,
}: Readonly<{
  name: keyof SplunkFormSchema;
  label: string;
  help: string;
  placeholder: string;
  testAttribute: string;
}>) {
  return (
    <SplunkFormField
      name={name}
      label={label}
      labelAction={
        <AkTooltip arrow title={help}>
          <AkIcon
            name="material-symbols:info"
            aria-label={help}
            className="size-4 text-secondary"
          />
        </AkTooltip>
      }
    >
      <AkInput placeholder={placeholder} {...{ [`data-test-${testAttribute}`]: true }} />
    </SplunkFormField>
  );
}

interface SplunkCredentialsStepProps {
  form: UseFormReturn<SplunkFormSchema>;
  isSaving: boolean;
  onSubmit: (credentials: SplunkFormSchema) => void;
}

/**
 * Step one: the instance and the two tokens it is reached with.
 *
 * It carries its own control rather than the panel's, since saving these is
 * what makes the instance's indexes readable for step two.
 *
 * @param props.form - The form holding the credentials.
 * @param props.isSaving - Marks the control busy while they are saved.
 * @param props.onSubmit - Called with the credentials once they are valid.
 */
export function SplunkCredentialsStep({
  form,
  isSaving,
  onSubmit,
}: Readonly<SplunkCredentialsStepProps>) {
  return (
    <AkFormProvider {...form}>
      <form
        noValidate
        aria-label={akMT('configureStep1')}
        className="mx-5.25 my-3.5 flex w-87.5 flex-col rounded-xs border border-border p-3.5"
      >
        <div className="flex w-full flex-col gap-3.5">
          <SplunkCredentialField
            name="instanceUrl"
            label={akMT('instanceURL')}
            help={akMT('splunk.instanceURLDesc')}
            placeholder={akMT('splunk.enterInstanceURL')}
            testAttribute="splunk-instance-url"
          />

          <SplunkCredentialField
            name="hecToken"
            label={akMT('splunk.hecToken')}
            help={akMT('splunk.hecTokenDesc')}
            placeholder={akMT('splunk.enterHecToken')}
            testAttribute="splunk-hec-token"
          />

          <SplunkCredentialField
            name="apiToken"
            label={akMT('splunk.apiToken')}
            help={akMT('splunk.apiTokenDesc')}
            placeholder={akMT('splunk.enterApiToken')}
            testAttribute="splunk-api-token"
          />
        </div>

        <AkButton
          type="button"
          className="mt-5.25 self-start"
          loading={isSaving}
          onClick={() => void form.handleSubmit(onSubmit)()}
          data-test-splunk-save-and-proceed
        >
          {akMT('saveAndProceed')}
        </AkButton>
      </form>
    </AkFormProvider>
  );
}

interface SplunkTargetsStepProps {
  targets: SplunkTargets;
  indexes: string[];
  onChange: (change: Partial<SplunkTargets>) => void;
}

/**
 * Step two: the index findings are written into, and optionally the one user activity goes to.
 *
 * @param props.targets - What the connection will write where.
 * @param props.indexes - The indexes the instance holds.
 * @param props.onChange - Called with whichever part of the choice changed.
 */
export function SplunkTargetsStep({
  targets,
  indexes,
  onChange,
}: Readonly<SplunkTargetsStepProps>) {
  return (
    <Fragment>
      <form
        noValidate
        aria-label={akMT('splunk.vulnIndex')}
        className="mx-5.25 my-3.5 flex w-87.5 flex-col rounded-xs border border-border p-3.5"
      >
        <div className="flex flex-col gap-1.5">
          <AkLabel htmlFor="splunk-vuln-index" className="text-md font-medium">
            {akMT('splunk.vulnIndex')}
          </AkLabel>

          <AkSelect
            value={targets.vulnerabilityIndex}
            onValueChange={(vulnerabilityIndex) => onChange({ vulnerabilityIndex })}
          >
            <AkSelectTrigger
              id="splunk-vuln-index"
              className="w-80 bg-background"
              data-test-splunk-vuln-index
            >
              <AkSelectValue />
            </AkSelectTrigger>

            <AkSelectContent>
              {indexes.map((index) => (
                <AkSelectItem key={index} value={index}>
                  {index}
                </AkSelectItem>
              ))}
            </AkSelectContent>
          </AkSelect>
        </div>
      </form>

      <div className="flex flex-col">
        <SplunkUserLogs
          showOptionalHeading
          isEditing
          sendUserLogs={targets.sendUserLogs}
          indexes={indexes}
          userLogsIndex={targets.userLogsIndex}
          logFrequencyHours={targets.logFrequencyHours}
          onToggleSendUserLogs={(sendUserLogs) => onChange({ sendUserLogs })}
          onUserLogsIndexChange={(userLogsIndex) => onChange({ userLogsIndex })}
          onLogFrequencyChange={(logFrequencyHours) => onChange({ logFrequencyHours })}
        />
      </div>
    </Fragment>
  );
}

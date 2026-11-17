import type { KeyboardEvent } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkTypography } from '@irene/ui/ak-typography';

import { PROMPT_MAX_LENGTH } from '../prompts';

interface PromptFormProps {
  value: string;
  onChange: (value: string) => void;
  onGenerate: () => void;
  onCancel: () => void;
  isGenerating: boolean;
}

/**
 * The question box: up to 400 characters with a running count, Generate (or
 * Cmd/Ctrl + Enter), and Cancel while a report is being generated.
 *
 * @param props.value - The question so far.
 * @param props.onChange - Receives the edited question.
 * @param props.onGenerate - Asks for the report.
 * @param props.onCancel - Stops waiting for it.
 * @param props.isGenerating - Whether a report is being generated.
 */
export function PromptForm({ value, onChange, onGenerate, onCancel, isGenerating }: Readonly<PromptFormProps>) {
  const canGenerate = value.trim().length > 0 && value.length <= PROMPT_MAX_LENGTH && !isGenerating;

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey) && canGenerate) {
      event.preventDefault();
      onGenerate();
    }
  };

  return (
    <section className="flex flex-col gap-3 rounded-md border border-border bg-background p-5" data-test-generate-form>
      <div className="flex flex-col gap-1">
        <AkTypography variant="subtitle1" tag="h2">
          {akMT('reportModule.whatDoYouWantToLearn')}
        </AkTypography>

        <AkTypography variant="body2" color="textSecondary">
          {akMT('reportModule.generate.promptHint')}
        </AkTypography>
      </div>

      <div className="flex flex-col rounded-md border border-border focus-within:border-primary">
        <textarea
          value={value}
          rows={5}
          disabled={isGenerating}
          aria-label={akMT('reportModule.whatDoYouWantToLearn')}
          placeholder={akMT('reportModule.generateReportPlaceholder')}
          className="
            resize-none rounded-t-md bg-background px-3.5 py-3 text-base outline-none
            disabled:bg-background-subtle
          "
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={onKeyDown}
          data-test-generate-prompt
        />

        <div className="
          flex flex-wrap items-center justify-between gap-2 border-t border-border px-3.5 py-2
        ">
          <AkTypography
            variant="body2"
            color={value.length > PROMPT_MAX_LENGTH ? 'error' : 'textSecondary'}
            className="tabular-nums"
            data-test-generate-count
          >
            {akMT('reportModule.generate.characterCount', { count: value.length, max: PROMPT_MAX_LENGTH })}
          </AkTypography>

          <div className="flex items-center gap-3">
            {isGenerating ? (
              <AkButton variant="outlined" color="neutral" onClick={onCancel}>
                {akMT('cancel')}
              </AkButton>
            ) : (
              <AkTypography variant="body2" color="textSecondary">
                {akMT('reportModule.generate.shortcut')}
              </AkTypography>
            )}

            <AkButton loading={isGenerating} disabled={!canGenerate} onClick={onGenerate} data-test-generate-submit>
              {isGenerating ? akMT('reportModule.generating') : akMT('reportModule.generateReport')}
            </AkButton>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useState } from 'react';

import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkIcon } from '@irene/ui/ak-icon';
import { AkTypography } from '@irene/ui/ak-typography';

import { EXAMPLE_PROMPTS, PROMPT_CATEGORIES, type PromptCategory } from '../prompts';

interface ExamplePromptsProps {
  disabled: boolean;
  onPaste: (prompt: string) => void;
  onGenerate: (prompt: string) => void;
}

/**
 * Example questions by category. Clicking one pastes it into the question box
 * to start from; "Generate now", shown on hover or focus, asks for it at once.
 *
 * @param props.disabled - Whether a report is being generated.
 * @param props.onPaste - Puts a prompt in the question box.
 * @param props.onGenerate - Asks for a prompt's report straight away.
 */
export function ExamplePrompts({ disabled, onPaste, onGenerate }: Readonly<ExamplePromptsProps>) {
  const [category, setCategory] = useState<PromptCategory>('vapt');

  return (
    <section className="flex flex-col gap-3" data-test-example-prompts>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-col gap-1">
          <AkTypography variant="subtitle1" tag="h2">
            {akMT('reportModule.notSureWhatToWrite')}
          </AkTypography>

          <AkTypography variant="body2" color="textSecondary">
            {akMT('reportModule.generate.examplesHint')}
          </AkTypography>
        </div>

        <div className="flex items-center gap-2">
          <AkTypography variant="body2" color="textSecondary">
            {akMT('reportModule.category')}
          </AkTypography>

          <AkSelect
            value={category}
            onValueChange={(value) => setCategory(PROMPT_CATEGORIES.find((c) => c === value) ?? 'vapt')}
          >
            <AkSelectTrigger aria-label={akMT('reportModule.category')} className="w-56">
              <AkSelectValue />
            </AkSelectTrigger>

            <AkSelectContent position="popper" align="end">
              {PROMPT_CATEGORIES.map((option) => (
                <AkSelectItem key={option} value={option}>
                  {akMT(`reportModule.examples.${option}.label`)}
                </AkSelectItem>
              ))}
            </AkSelectContent>
          </AkSelect>
        </div>
      </div>

      <ul className="
        flex flex-col divide-y divide-border rounded-md border border-border bg-background
      ">
        {EXAMPLE_PROMPTS[category].map((id) => {
          const prompt = akMT(id);

          return (
            <li key={id} className="group flex items-center gap-2 px-3 py-1.5 hover:bg-hover-light">
              <button
                type="button"
                disabled={disabled}
                title={akMT('reportModule.generate.pastePrompt')}
                className="
                  flex min-w-0 flex-1 items-center gap-2.5 py-1.5 text-left
                  disabled:opacity-60
                "
                onClick={() => onPaste(prompt)}
                data-test-example-prompt
              >
                <AkIcon name="material-symbols:auto-awesome-outline" className="shrink-0 text-info" />

                <AkTypography tag="span">{prompt}</AkTypography>
              </button>

              <AkButton
                variant="outlined"
                size="sm"
                disabled={disabled}
                aria-label={akMT('reportModule.generate.generateFor', { prompt })}
                className="opacity-0 group-focus-within:opacity-100 group-hover:opacity-100"
                leftIcon={<AkIcon name="material-symbols:play-arrow" />}
                onClick={() => onGenerate(prompt)}
              >
                {akMT('reportModule.generate.generateNow')}
              </AkButton>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';

import { akMT } from '@irene/translations/intl';
import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { AkTypography } from '@irene/ui/ak-typography';

import { organizationAiSettingsOptions } from '@/features/reports/queries/report-requests';
import { useOrganization } from '@/hooks/use-organization';

import { ExamplePrompts } from './components/example-prompts';
import { PromptForm } from './components/prompt-form';
import { TurnOnSettings } from './components/turn-on-settings';
import { PROMPT_MAX_LENGTH } from './prompts';
import { useGenerateReport } from './use-generate-report';

/**
 * Where a report starts: a question in plain words, or an example to start
 * from. The report opens once Luna has generated it.
 *
 * The organization's own AI settings are read first, as irene reads them: with
 * AI reporting off there (or unreadable), the page says how to switch it on.
 */
export function GeneratePage() {
  const organization = useOrganization();
  const settings = useQuery(organizationAiSettingsOptions(organization.selectedId()));
  const [query, setQuery] = useState('');
  const { generate, cancel, isGenerating } = useGenerateReport();

  if (settings.isPending) {
    return (
      <section className="flex flex-col gap-4 p-6" data-test-generate-loading>
        <AkSkeleton width="420px" height="32px" />

        <AkSkeleton height="180px" />

        <AkSkeleton height="240px" />
      </section>
    );
  }

  if (!settings.data?.reporting) {
    return <TurnOnSettings isOwner={organization.isOwner()} />;
  }

  return (
    <section className="flex flex-col gap-6 p-6" data-test-generate-page>
      <div className="flex flex-col gap-1">
        <AkTypography variant="h4" tag="h1" color="primary">
          {akMT('reportModule.describeTheReport')}
        </AkTypography>

        <AkTypography color="textSecondary" className="max-w-160">
          {akMT('reportModule.generate.intro')}
        </AkTypography>
      </div>

      <PromptForm
        value={query}
        onChange={setQuery}
        onGenerate={() => generate(query)}
        onCancel={cancel}
        isGenerating={isGenerating}
      />

      <ExamplePrompts
        disabled={isGenerating}
        onPaste={(prompt) => setQuery(prompt.slice(0, PROMPT_MAX_LENGTH))}
        onGenerate={(prompt) => {
          setQuery(prompt);
          generate(prompt);
        }}
      />
    </section>
  );
}

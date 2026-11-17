import type { PlainMessageId } from '@irene/translations/messages';

/** The example categories, in the order the picker lists them, as the design has them. */
export const PROMPT_CATEGORIES = ['vapt', 'audit', 'sbom', 'privacy', 'store'] as const;

/** One example category. */
export type PromptCategory = (typeof PROMPT_CATEGORIES)[number];

/** The example prompts of each category, as message ids so both languages carry them. */
export const EXAMPLE_PROMPTS: Record<PromptCategory, PlainMessageId[]> = {
  vapt: [
    'reportModule.examples.vapt.prompt1',
    'reportModule.examples.vapt.prompt2',
    'reportModule.examples.vapt.prompt3',
    'reportModule.examples.vapt.prompt4',
    'reportModule.examples.vapt.prompt5',
  ],
  audit: ['reportModule.examples.audit.prompt1'],
  sbom: [
    'reportModule.examples.sbom.prompt1',
    'reportModule.examples.sbom.prompt2',
    'reportModule.examples.sbom.prompt3',
    'reportModule.examples.sbom.prompt4',
  ],
  privacy: [
    'reportModule.examples.privacy.prompt1',
    'reportModule.examples.privacy.prompt2',
    'reportModule.examples.privacy.prompt3',
    'reportModule.examples.privacy.prompt4',
  ],
  store: [
    'reportModule.examples.store.prompt1',
    'reportModule.examples.store.prompt2',
    'reportModule.examples.store.prompt3',
    'reportModule.examples.store.prompt4',
  ],
};

/** The longest question Luna takes, as irene limits it. */
export const PROMPT_MAX_LENGTH = 400;

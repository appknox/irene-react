import type { ReactNode } from 'react';
import type { RichTextTagName } from '../shared/rich-text-tags.ts';

/**
 * Renders the markup tags translations use, so no message needs raw HTML.
 * `satisfies` keeps this in step with `RICH_TEXT_TAG_NAMES`: a missing or extra tag fails type-checking.
 */
export const RICH_TEXT_TAGS = {
  b: (chunks: ReactNode[]) => <b>{chunks}</b>,
  strong: (chunks: ReactNode[]) => <strong>{chunks}</strong>,
  em: (chunks: ReactNode[]) => <em>{chunks}</em>,
  code: (chunks: ReactNode[]) => <code>{chunks}</code>,
  span: (chunks: ReactNode[]) => <span>{chunks}</span>,
  br: () => <br />,
} satisfies Record<RichTextTagName, (chunks: ReactNode[]) => ReactNode>;

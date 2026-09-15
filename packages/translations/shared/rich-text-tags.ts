/** The markup tags messages may use. Each needs a renderer in `RICH_TEXT_TAGS`. */
export const RICH_TEXT_TAG_NAMES = ['b', 'strong', 'em', 'code', 'span', 'br'] as const;
export type RichTextTagName = (typeof RICH_TEXT_TAG_NAMES)[number];

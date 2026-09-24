import { render } from '@testing-library/react';
import { Fragment } from 'react';
import { describe, expect, it } from 'vitest';

import { RICH_TEXT_TAG_NAMES } from '../shared/rich-text-tags.ts';
import { RICH_TEXT_TAGS } from './rich-text.tsx';

describe('RICH_TEXT_TAGS', () => {
  it('declares a renderer for each supported tag name', () => {
    expect(Object.keys(RICH_TEXT_TAGS).sort((a, b) => a.localeCompare(b))).toEqual(
      [...RICH_TEXT_TAG_NAMES].sort((a, b) => a.localeCompare(b))
    );
  });

  it.each(['b', 'strong', 'em', 'code', 'span'] as const)(
    'renders <%s> around its content',
    (name) => {
      const { container } = render(<Fragment>{RICH_TEXT_TAGS[name](['content'])}</Fragment>);

      expect(container.innerHTML).toBe(`<${name}>content</${name}>`);
    }
  );

  it('renders <br> as an empty element', () => {
    const { container } = render(<Fragment>{RICH_TEXT_TAGS.br()}</Fragment>);

    expect(container.innerHTML).toBe('<br>');
  });
});

import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import en from '../src/generated/en.json';

describe('textForRichTextMessage', () => {
  it('returns a plain message unchanged', () => {
    expect(textForRichTextMessage(akMT('login'))).toBe(en.login);
  });

  it('returns the text a message with markup renders as', () => {
    const { container } = render(<p>{akMT('uploadNewProject')}</p>);

    expect(textForRichTextMessage(akMT('uploadNewProject'))).toBe(container.textContent);
  });

  it('returns the text of a message whose markup carries no text of its own', () => {
    const { container } = render(<p>{akMT('capturedApiEmptyDesc')}</p>);

    expect(textForRichTextMessage(akMT('capturedApiEmptyDesc'))).toBe(container.textContent);
  });

  it('includes the arguments filled in inside markup', () => {
    expect(
      textForRichTextMessage(akMT('apiScanModule.reportRegenerateText', { reportType: 'PDF' }))
    ).toContain('PDF');
  });

  it('writes a number out', () => {
    expect(textForRichTextMessage(7)).toBe('7');
  });

  it('joins the parts of an array, leaving out what renders nothing', () => {
    expect(textForRichTextMessage(['a', 1, null, undefined, false])).toBe('a1');
  });

  it('returns an empty string for a node that renders nothing', () => {
    expect(textForRichTextMessage(null)).toBe('');
    expect(textForRichTextMessage(undefined)).toBe('');
    expect(textForRichTextMessage(true)).toBe('');
  });
});

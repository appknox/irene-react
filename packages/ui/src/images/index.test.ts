import { describe, expect, it } from 'vitest';

import slackIcon from '@irene/ui/images/slack-icon.png';
import xmlIcon from '@irene/ui/images/xml.svg';

const images = import.meta.glob('./*.{png,svg}', { eager: true, query: '?url', import: 'default' });

describe('images', () => {
  it('bundles 23 image files', () => {
    expect(Object.keys(images)).toHaveLength(23);
  });

  it.each(Object.entries(images))('%s resolves to a url', (_, url) => {
    expect(url).toBeTypeOf('string');
  });

  it('resolves each import to a URL carrying the file name', () => {
    expect(slackIcon).toContain('slack-icon');
    expect(xmlIcon).toContain('xml');
  });
});

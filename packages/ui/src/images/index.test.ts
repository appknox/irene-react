import { describe, expect, it } from 'vitest';

import slackIcon from '@irene/ui/images/slack-icon.png';
import xmlIcon from '@irene/ui/images/xml.svg';

const images = import.meta.glob('./*.{png,svg}', { eager: true, query: '?url', import: 'default' });

describe('images', () => {
  it('ports every image irene uses from its public folder, minus the whitelabel defaults', () => {
    expect(Object.keys(images)).toHaveLength(23);
  });

  it.each(Object.entries(images))('%s resolves to a url', (_, url) => {
    expect(url).toBeTypeOf('string');
  });

  it('gives an image a url a component can use as a src', () => {
    expect(slackIcon).toContain('slack-icon');
    expect(xmlIcon).toContain('xml');
  });
});

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

import { flattenMessages, type MessageTree } from './flatten.ts';
import { findRichMessageIds, findUnsupportedTags } from './rich-messages.ts';

const translationsDir = resolve(dirname(fileURLToPath(import.meta.url)), '../../translations');

const readShippedLocale = (locale: string) =>
  flattenMessages(
    JSON.parse(readFileSync(resolve(translationsDir, `${locale}.json`), 'utf8')) as MessageTree
  );

describe('findRichMessageIds', () => {
  it('finds messages with tags', () => {
    expect(
      findRichMessageIds({ en: { bold: '<b>Hi</b>', br: 'a<br></br>b', plain: 'Hi' } })
    ).toEqual(['bold', 'br']);
  });

  it('finds tags inside plural and select options', () => {
    expect(
      findRichMessageIds({
        en: {
          plural: '{count, plural, one {<b>#</b> file} other {# files}}',
          select: '{kind, select, app {<em>App</em>} other {Other}}',
        },
      })
    ).toEqual(['plural', 'select']);
  });

  it('ignores plain messages with arguments, plurals and escaped brackets', () => {
    expect(
      findRichMessageIds({
        en: {
          argument: 'Hi {name}',
          plural: '{n, plural, other {#}}',
          escaped: "keep '<n>' newest",
        },
      })
    ).toEqual([]);
  });

  it('counts a message as rich when only one locale has markup', () => {
    expect(
      findRichMessageIds({
        en: { a: 'Selected - <strong>{x}</strong>' },
        ja: { a: 'Selected - {x}' },
      })
    ).toEqual(['a']);
  });

  it('lists each id once, sorted', () => {
    expect(
      findRichMessageIds({
        en: { z: '<b>z</b>', a: '<b>a</b>' },
        ja: { z: '<b>z</b>', a: '<b>a</b>' },
      })
    ).toEqual(['a', 'z']);
  });
});

describe('findUnsupportedTags', () => {
  it('accepts every tag that has a renderer', () => {
    expect(
      findUnsupportedTags({
        en: { a: '<b>b</b><strong>s</strong><em>e</em><code>c</code><span>x</span>a<br></br>b' },
      })
    ).toEqual([]);
  });

  it('reports a tag with no renderer and says how to fix it', () => {
    const [problem] = findUnsupportedTags({ en: { link: 'Read <a>the docs</a>' } });

    expect(problem).toContain('en: "link" uses <a>, which has no renderer.');
    expect(problem).toContain('Use one of <b>, <strong>, <em>, <code>, <span>, <br>');
    expect(problem).toContain('add "a" to RICH_TEXT_TAG_NAMES');
    expect(problem).toContain('RICH_TEXT_TAGS in packages/translations/src/rich-text.tsx');
  });

  it('finds unsupported tags nested in other tags and in plural options', () => {
    const problems = findUnsupportedTags({
      en: {
        nested: '<strong><u>x</u></strong>',
        plural: '{n, plural, other {<li>#</li>}}',
      },
    });

    expect(problems).toHaveLength(2);
    expect(problems[0]).toContain('"nested" uses <u>');
    expect(problems[1]).toContain('"plural" uses <li>');
  });

  it('reports the tag in the locale that uses it', () => {
    const problems = findUnsupportedTags({ en: { a: '<b>x</b>' }, ja: { a: '<i>x</i>' } });

    expect(problems).toEqual([expect.stringContaining('ja: "a" uses <i>')]);
  });

  it('reports each unsupported tag in a message once', () => {
    expect(findUnsupportedTags({ en: { a: '<i>x</i> and <i>y</i> and <u>z</u>' } })).toHaveLength(
      2
    );
  });

  it('accepts the shipped translations', () => {
    expect(
      findUnsupportedTags({ en: readShippedLocale('en'), ja: readShippedLocale('ja') })
    ).toEqual([]);
  });
});

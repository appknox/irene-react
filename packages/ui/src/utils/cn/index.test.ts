import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { cn, SHADOW_SCALE } from '@irene/ui/cn';

/** Where this package lives, handed over by vitest.config.ts. */
const packageRoot = process.env.IRENE_UI_PACKAGE_ROOT;

describe('joining', () => {
  it('joins strings', () => {
    expect(cn('text-sm', 'font-bold')).toBe('text-sm font-bold');
  });

  it('keeps object keys whose value is truthy', () => {
    expect(cn({ 'opacity-50': true, hidden: false })).toBe('opacity-50');
  });

  it('flattens arrays and drops empty values', () => {
    expect(cn(['text-sm', null], undefined, false, 'font-bold')).toBe('text-sm font-bold');
  });
});

describe('conflict resolution, last one wins', () => {
  it.each([
    ['p-4', 'p-2'],
    ['text-sm', 'text-lg'],
    ['rounded-sm', 'rounded-2xl'],
    ['font-normal', 'font-bold'],
  ])('%s then %s keeps the second', (first, second) => {
    expect(cn(first, second)).toBe(second);
  });

  it('keeps classes that target different properties', () => {
    expect(cn('p-4', 'text-sm')).toBe('p-4 text-sm');
  });
});

describe('the custom theme', () => {
  // These scales are ours, not Tailwind's defaults, so tailwind-merge has to
  // be taught about them or it treats the classes as unrelated.
  it('merges the numbered shadow scale', () => {
    expect(cn('shadow-1', 'shadow-8')).toBe('shadow-8');
  });

  it('lets a numbered shadow conflict with shadow-none', () => {
    expect(cn('shadow-8', 'shadow-none')).toBe('shadow-none');
    expect(cn('shadow-none', 'shadow-3')).toBe('shadow-3');
  });

  it('keeps a text size and a text colour apart', () => {
    expect(cn('text-sm', 'text-primary')).toBe('text-sm text-primary');
  });

  it('covers every shadow step the theme declares', () => {
    const theme = readFileSync(join(packageRoot, 'styles/theme.css'), 'utf8');
    const declared = [...theme.matchAll(/--shadow-([\w-]+):/g)].map((m) => m[1]);

    expect([...SHADOW_SCALE].sort()).toEqual([...declared].sort());
  });

  it('merges semantic text colours', () => {
    expect(cn('text-primary', 'text-danger')).toBe('text-danger');
  });

  it('merges semantic background colours', () => {
    expect(cn('bg-success-surface', 'bg-danger-surface')).toBe('bg-danger-surface');
  });
});

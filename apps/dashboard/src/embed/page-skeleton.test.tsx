import { render } from '@testing-library/react';
import { act, lazy } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { mountIreneComponent } from './mount-component';
import { PageSkeleton } from './page-skeleton';

/*
  A page registered only for these tests, so the machinery is exercised whatever
  a branch has registered. `lazy` so it suspends, as a real page does.
*/
vi.mock('./pages', () => {
  const TestPage = (props: Record<string, unknown>) => `test:${props.label ?? ''}`;
  const page = lazy(async () => ({ default: TestPage }));

  return {
    EMBEDDABLE_PAGES: { TestPage: page },
    findEmbeddablePage: (name: string) => (name === 'TestPage' ? page : undefined),
    findPageSkeleton: () => undefined,
  };
});

describe('PageSkeleton', () => {
  it('stands in for the screen without announcing itself', () => {
    const { container } = render(<PageSkeleton />);

    expect(container.querySelector('[data-test-embed-page-skeleton]')).not.toBeNull();

    for (const placeholder of container.querySelectorAll('[data-slot="skeleton"]')) {
      expect(placeholder).toHaveAttribute('aria-hidden', 'true');
    }
  });
});

describe('while a page is still arriving', () => {
  /*
    A page is loaded on demand and `lazy` caches what it resolved, so this is
    the only mount in this file: a second one would render straight away and
    never suspend.
  */
  it("holds the skeleton rather than the app's own cold-start screen", () => {
    const element = document.createElement('div');

    document.body.append(element);

    act(() => {
      mountIreneComponent(element, { name: 'TestPage' });
    });

    expect(element.querySelector('[data-test-embed-page-skeleton]')).not.toBeNull();
  });
});

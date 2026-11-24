import { waitFor } from '@testing-library/react';
import { act, lazy } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { mountIreneComponent } from './mount-component';

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

describe('mountIreneComponent', () => {
  it('refuses a name nothing is registered under, rather than leaving an empty box', () => {
    const element = document.createElement('div');

    expect(() => mountIreneComponent(element, { name: 'NoSuchComponent' })).toThrowError(
      /No embeddable page named "NoSuchComponent"/
    );
  });

  it('says what is available, so a typo in a host template is obvious', () => {
    const element = document.createElement('div');

    expect(() => mountIreneComponent(element, { name: 'Nope' })).toThrowError(
      /None are registered yet|Known pages:/
    );
  });

  it('refuses before touching the element, so a failed mount leaves nothing behind', () => {
    const element = document.createElement('div');

    expect(() => mountIreneComponent(element, { name: 'Nope' })).toThrow();
    expect(element.dataset.reactRoot).toBeUndefined();
    expect(element.innerHTML).toBe('');
  });
});

describe('a mounted component', () => {
  /* The page is loaded on demand, so it suspends before it draws. */
  async function mount(props?: Record<string, unknown>) {
    const element = document.createElement('div');

    document.body.append(element);

    const mounted = await act(async () =>
      mountIreneComponent(element, { name: 'TestPage', props })
    );

    await waitFor(() => expect(element.textContent).toContain('test:'));

    return { element, mounted };
  }

  it('renders the registered screen into the element it is given', async () => {
    const { element } = await mount();

    expect(element.textContent).toContain('test:');
  });

  it('marks the element, so a host can see the app owns its contents', async () => {
    const { element } = await mount();

    expect(element.dataset.reactRoot).toBe('');
  });

  it('renders again with new props, keeping the tree', async () => {
    const { element, mounted } = await mount({ label: 'first' });

    expect(element.textContent).toContain('test:first');

    await act(async () => mounted.update({ label: 'second' }));

    await waitFor(() => expect(element.textContent).toContain('test:second'));
  });

  it('takes the component down, leaving the element empty', async () => {
    const { element, mounted } = await mount();

    await act(async () => {
      mounted.destroy();

      /* Unmounting waits a tick, so the host's own teardown does not warn. */
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(element.innerHTML).toBe('');
  });
});

describe('a host that draws the placeholder itself', () => {
  it('is told once the screen has content', async () => {
    const element = document.createElement('div');
    const onReady = vi.fn();

    document.body.append(element);

    await act(async () => {
      mountIreneComponent(element, { name: 'TestPage', onReady });
    });

    await waitFor(() => expect(element.textContent).toContain('test:'));
    expect(onReady).toHaveBeenCalled();
  });

  it('is handed no placeholder of its own, so only one is ever on screen', () => {
    const element = document.createElement('div');

    document.body.append(element);

    act(() => {
      mountIreneComponent(element, { name: 'TestPage', onReady: vi.fn() });
    });

    expect(element.querySelector('[data-test-embed-page-skeleton]')).toBeNull();
  });
});

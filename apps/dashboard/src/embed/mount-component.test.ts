import { waitFor } from '@testing-library/react';
import { act } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { mountIreneComponent } from './mount-component';

/* The registry holds real screens; this exercises the machinery around them. */
vi.mock('@/features/dashboard/pages/home', () => ({
  HomePage: (props: Record<string, unknown>) => `home:${props.label ?? ''}`,
}));

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
      mountIreneComponent(element, { name: 'HomePage', props })
    );

    await waitFor(() => expect(element.textContent).toContain('home:'));

    return { element, mounted };
  }

  it('renders the registered screen into the element it is given', async () => {
    const { element } = await mount();

    expect(element.textContent).toContain('home:');
  });

  it('marks the element, so a host can see the app owns its contents', async () => {
    const { element } = await mount();

    expect(element.dataset.reactRoot).toBe('');
  });

  it('renders again with new props, keeping the tree', async () => {
    const { element, mounted } = await mount({ label: 'first' });

    expect(element.textContent).toContain('home:first');

    await act(async () => mounted.update({ label: 'second' }));

    await waitFor(() => expect(element.textContent).toContain('home:second'));
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
      mountIreneComponent(element, { name: 'HomePage', onReady });
    });

    await waitFor(() => expect(element.textContent).toContain('home:'));
    expect(onReady).toHaveBeenCalled();
  });

  it('is handed no placeholder of its own, so only one is ever on screen', () => {
    const element = document.createElement('div');

    document.body.append(element);

    act(() => {
      mountIreneComponent(element, { name: 'HomePage', onReady: vi.fn() });
    });

    expect(element.querySelector('[data-test-embed-page-skeleton]')).toBeNull();
  });
});

describe('the placeholder a mount shows while a screen loads', () => {
  it("draws the screen's own frame where the screen registers one", () => {
    const element = document.createElement('div');

    document.body.append(element);

    act(() => {
      mountIreneComponent(element, { name: 'AccountSettings' });
    });

    expect(element.querySelector('[data-test-account-settings-skeleton]')).not.toBeNull();
  });
});

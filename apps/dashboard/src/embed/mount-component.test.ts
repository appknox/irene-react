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
      /No embeddable component named "NoSuchComponent"/
    );
  });

  it('says what is available, so a typo in a host template is obvious', () => {
    const element = document.createElement('div');

    expect(() => mountIreneComponent(element, { name: 'Nope' })).toThrowError(
      /None are registered yet|Known components:/
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
  function mount(props?: Record<string, unknown>) {
    const element = document.createElement('div');

    document.body.append(element);

    const mounted = act(() => mountIreneComponent(element, { name: 'HomePage', props }));

    return { element, mounted };
  }

  it('renders the registered screen into the element it is given', () => {
    const { element } = mount();

    expect(element.textContent).toContain('home:');
  });

  it('marks the element, so a host can see the app owns its contents', () => {
    const { element } = mount();

    expect(element.dataset.reactRoot).toBe('');
  });

  it('renders again with new props, keeping the tree', async () => {
    const { element, mounted } = mount({ label: 'first' });

    expect(element.textContent).toContain('home:first');

    await act(async () => (await mounted).update({ label: 'second' }));

    expect(element.textContent).toContain('home:second');
  });

  it('takes the component down, leaving the element empty', async () => {
    const { element, mounted } = mount();

    await act(async () => {
      (await mounted).destroy();

      /* Unmounting waits a tick, so the host's own teardown does not warn. */
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    expect(element.innerHTML).toBe('');
  });
});

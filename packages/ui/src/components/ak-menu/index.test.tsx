import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';

import {
  AkMenu,
  AkMenuContent,
  AkMenuItem,
  AkMenuSeparator,
  AkMenuTrigger,
} from '@irene/ui/ak-menu';

const AccountMenu = (props: ComponentProps<typeof AkMenuContent>) => (
  <AkMenu>
    <AkMenuTrigger>ada@appknox.com</AkMenuTrigger>

    <AkMenuContent {...props}>
      <AkMenuItem>Ada Lovelace</AkMenuItem>

      <AkMenuSeparator />

      <AkMenuItem onSelect={() => undefined}>Log out</AkMenuItem>
    </AkMenuContent>
  </AkMenu>
);

const openMenu = () => userEvent.click(screen.getByRole('button', { name: 'ada@appknox.com' }));

describe('AkMenu', () => {
  it('stays shut until the trigger is pressed', () => {
    render(<AccountMenu />);

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('reads as a menu of items, so a screen reader announces what it is', async () => {
    render(<AccountMenu />);

    await openMenu();

    expect(await screen.findByRole('menu')).toBeInTheDocument();
    expect(screen.getAllByRole('menuitem')).toHaveLength(2);
  });

  it('calls an item that acts, and closes behind it', async () => {
    const onSelect = vi.fn();

    render(
      <AkMenu>
        <AkMenuTrigger>Account</AkMenuTrigger>

        <AkMenuContent>
          <AkMenuItem onSelect={onSelect}>Log out</AkMenuItem>
        </AkMenuContent>
      </AkMenu>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Account' }));
    await userEvent.click(await screen.findByRole('menuitem', { name: 'Log out' }));

    expect(onSelect).toHaveBeenCalledOnce();
    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('takes no pointer on an item that only states something', async () => {
    render(<AccountMenu />);

    await openMenu();

    expect(await screen.findByRole('menuitem', { name: 'Ada Lovelace' })).toHaveClass(
      'cursor-default'
    );
  });

  it('sets an acting item apart when it is the one that stands out', async () => {
    render(
      <AkMenu>
        <AkMenuTrigger>Account</AkMenuTrigger>

        <AkMenuContent>
          <AkMenuItem color="primary" onSelect={() => undefined}>
            Log out
          </AkMenuItem>
        </AkMenuContent>
      </AkMenu>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Account' }));

    expect(await screen.findByRole('menuitem', { name: 'Log out' })).toHaveClass('text-primary');
  });

  it('closes on Escape, so the keyboard is not trapped in it', async () => {
    render(<AccountMenu />);

    await openMenu();
    await screen.findByRole('menu');

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('menu')).not.toBeInTheDocument();
  });

  it('moves between items with the arrow keys', async () => {
    render(<AccountMenu />);

    await openMenu();
    await screen.findByRole('menu');

    await userEvent.keyboard('{ArrowDown}');

    expect(screen.getByRole('menuitem', { name: 'Ada Lovelace' })).toHaveFocus();
  });

  it('draws a pointer at the trigger when asked', async () => {
    render(<AccountMenu arrow />);

    await openMenu();
    await screen.findByRole('menu');

    expect(document.querySelector('[data-slot="menu-arrow"]')).toBeInTheDocument();
  });

  it('rules off one group of actions from the next', async () => {
    render(<AccountMenu />);

    await openMenu();
    await screen.findByRole('menu');

    expect(document.querySelector('[data-slot="menu-separator"]')).toBeInTheDocument();
  });

  it('takes classes of its own on the menu', async () => {
    render(<AccountMenu className="w-80" />);

    await openMenu();

    expect(await screen.findByRole('menu')).toHaveClass('w-80');
  });
});

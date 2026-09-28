import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ComponentProps } from 'react';

import {
  AkPopover,
  AkPopoverClose,
  AkPopoverContent,
  AkPopoverTrigger,
} from '@irene/ui/ak-popover';

const Switcher = (props: ComponentProps<typeof AkPopoverContent>) => (
  <AkPopover>
    <AkPopoverTrigger asChild>
      <button type="button">Switch to</button>
    </AkPopoverTrigger>

    <AkPopoverContent {...props}>
      <a href="/dashboard/projects">Appknox</a>
    </AkPopoverContent>
  </AkPopover>
);

const openSwitcher = () => userEvent.click(screen.getByRole('button', { name: 'Switch to' }));

describe('AkPopover', () => {
  it('stays shut until the trigger is pressed', () => {
    render(<Switcher />);

    expect(screen.queryByRole('link', { name: 'Appknox' })).not.toBeInTheDocument();
  });

  it('opens on the trigger', async () => {
    render(<Switcher />);

    await openSwitcher();

    expect(await screen.findByRole('link', { name: 'Appknox' })).toBeInTheDocument();
  });

  it('closes on Escape, so the keyboard is not trapped in it', async () => {
    render(<Switcher />);

    await openSwitcher();
    await screen.findByRole('link', { name: 'Appknox' });

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('link', { name: 'Appknox' })).not.toBeInTheDocument();
  });

  it('reports each change, so the opener can follow it', async () => {
    const changes: boolean[] = [];

    render(
      <AkPopover onOpenChange={(open) => changes.push(open)}>
        <AkPopoverTrigger asChild>
          <button type="button">Switch to</button>
        </AkPopoverTrigger>

        <AkPopoverContent>
          <a href="/dashboard/projects">Appknox</a>
        </AkPopoverContent>
      </AkPopover>
    );

    await openSwitcher();
    await screen.findByRole('link', { name: 'Appknox' });

    await userEvent.keyboard('{Escape}');

    expect(changes).toEqual([true, false]);
  });

  it('stays open for a panel its opener holds open', async () => {
    render(
      <AkPopover open>
        <AkPopoverTrigger asChild>
          <button type="button">Switch to</button>
        </AkPopoverTrigger>

        <AkPopoverContent>
          <a href="/dashboard/projects">Appknox</a>
        </AkPopoverContent>
      </AkPopover>
    );

    expect(await screen.findByRole('link', { name: 'Appknox' })).toBeInTheDocument();
  });

  it('closes on a control within it', async () => {
    render(
      <AkPopover>
        <AkPopoverTrigger asChild>
          <button type="button">Switch to</button>
        </AkPopoverTrigger>

        <AkPopoverContent>
          <AkPopoverClose>Done</AkPopoverClose>
        </AkPopoverContent>
      </AkPopover>
    );

    await openSwitcher();

    await userEvent.click(await screen.findByRole('button', { name: 'Done' }));

    expect(screen.queryByRole('button', { name: 'Done' })).not.toBeInTheDocument();
  });

  it('draws a pointer at the trigger when asked', async () => {
    render(<Switcher arrow />);

    await openSwitcher();
    await screen.findByRole('link', { name: 'Appknox' });

    expect(document.querySelector('[data-slot="popover-arrow"]')).toBeInTheDocument();
  });

  it('takes classes of its own on the panel', async () => {
    render(<Switcher className="w-50" />);

    await openSwitcher();

    expect(document.querySelector('[data-slot="popover-content"]')).toHaveClass('w-50');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ComponentProps } from 'react';

import {
  AkModal,
  AkModalBody,
  AkModalContent,
  AkModalFooter,
  AkModalHeader,
  AkModalTrigger,
} from '@irene/ui/ak-modal';

const Invite = (props: ComponentProps<typeof AkModal>) => (
  <AkModal {...props}>
    <AkModalTrigger>Invite a teammate</AkModalTrigger>

    <AkModalContent>
      <AkModalHeader title="Invite a teammate" closeLabel="Close" />

      <AkModalBody>
        <label htmlFor="email">Email</label>

        <input id="email" />
      </AkModalBody>

      <AkModalFooter>
        <button type="button">Send</button>
      </AkModalFooter>
    </AkModalContent>
  </AkModal>
);

const openInvite = () => userEvent.click(screen.getByRole('button', { name: 'Invite a teammate' }));

describe('AkModal', () => {
  it('stays shut until the trigger is pressed', () => {
    render(<Invite />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens on the trigger', async () => {
    render(<Invite />);

    await openInvite();

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('is named by its header, so a screen reader reads what it is for', async () => {
    render(<Invite />);

    await openInvite();

    expect(await screen.findByRole('dialog', { name: 'Invite a teammate' })).toBeInTheDocument();
  });

  it('closes on the control in its header', async () => {
    render(<Invite />);

    await openInvite();
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape, so the keyboard is not trapped in it', async () => {
    render(<Invite />);

    await openInvite();
    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('reports each change, so the opener can follow it', async () => {
    const onOpenChange = vi.fn();

    render(<Invite onOpenChange={onOpenChange} />);

    await openInvite();

    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('stays open for a panel its opener holds open', async () => {
    render(<Invite open />);

    await userEvent.keyboard('{Escape}');

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });

  it('pads its body, and drops that padding when asked', () => {
    const { rerender } = render(
      <AkModal open>
        <AkModalContent>
          <AkModalHeader title="Invite a teammate" closeLabel="Close" />

          <AkModalBody>Body</AkModalBody>
        </AkModalContent>
      </AkModal>
    );

    expect(document.querySelector('[data-slot="modal-body"]')).toHaveClass('p-4.25');

    rerender(
      <AkModal open>
        <AkModalContent>
          <AkModalHeader title="Invite a teammate" closeLabel="Close" />

          <AkModalBody noGutter>Body</AkModalBody>
        </AkModalContent>
      </AkModal>
    );

    expect(document.querySelector('[data-slot="modal-body"]')).not.toHaveClass('p-4.25');
  });
});

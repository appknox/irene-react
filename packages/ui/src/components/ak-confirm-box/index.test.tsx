import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { AkConfirmBox } from './index';

describe('AkConfirmBox', () => {
  it('titles the box and asks the question it is given', async () => {
    render(
      <AkConfirmBox isOpen description="Remove the namespace?" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    expect(await screen.findByRole('heading', { name: akMT('confirm') })).toBeInTheDocument();

    expect(screen.getByText('Remove the namespace?')).toBeInTheDocument();
  });

  it('offers to go ahead before offering the way out', async () => {
    render(
      <AkConfirmBox isOpen description="Remove it?" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    const dialog = await screen.findByRole('dialog');
    const buttons = within(dialog).getAllByRole('button');

    expect(buttons[1]).toHaveAccessibleName(akMT('ok'));
    expect(buttons[2]).toHaveAccessibleName(akMT('cancel'));
  });

  it('carries the action’s own word where one is given', async () => {
    render(
      <AkConfirmBox
        isOpen
        description="Send it again?"
        confirmText={akMT('resend')}
        onConfirm={vi.fn()}
        onCancel={vi.fn()}
      />
    );

    expect(await screen.findByRole('button', { name: akMT('resend') })).toBeInTheDocument();
  });

  it('goes ahead when the confirming control is pressed', async () => {
    const user = userEvent.setup();
    const onConfirm = vi.fn();

    render(
      <AkConfirmBox isOpen description="Remove it?" onConfirm={onConfirm} onCancel={vi.fn()} />
    );

    await user.click(await screen.findByRole('button', { name: akMT('ok') }));

    expect(onConfirm).toHaveBeenCalledOnce();
  });

  it('leaves things as they are when dismissed', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <AkConfirmBox isOpen description="Remove it?" onConfirm={vi.fn()} onCancel={onCancel} />
    );

    await user.click(await screen.findByRole('button', { name: akMT('cancel') }));

    expect(onCancel).toHaveBeenCalledOnce();
  });

  it('holds the box open while the action runs', async () => {
    const user = userEvent.setup();
    const onCancel = vi.fn();

    render(
      <AkConfirmBox isOpen isWorking description="Remove it?" onConfirm={vi.fn()} onCancel={onCancel} />
    );

    await user.keyboard('{Escape}');

    expect(onCancel).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: akMT('cancel') })).toBeDisabled();
  });

  it('asks what it is given in place of a plain question', async () => {
    render(
      <AkConfirmBox isOpen onConfirm={vi.fn()} onCancel={vi.fn()}>
        <p>Two teams lose access.</p>
      </AkConfirmBox>
    );

    expect(await screen.findByText('Two teams lose access.')).toBeInTheDocument();
  });

  it('draws nothing while it is not being asked', () => {
    render(
      <AkConfirmBox isOpen={false} description="Remove it?" onConfirm={vi.fn()} onCancel={vi.fn()} />
    );

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

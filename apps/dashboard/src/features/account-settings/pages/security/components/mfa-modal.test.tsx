import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StrictMode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { AkModalBody } from '@irene/ui/ak-modal';

import { renderWithProviders } from '@tests/render';

import { MfaModal } from './mfa-modal';
import { useMfaModal } from './use-mfa-modal';

/** A step as the MFA components write one: it opens on mount and closes itself. */
function Step({ onClose }: Readonly<{ onClose: () => void }>) {
  const { closeModal, modalProps } = useMfaModal(onClose);

  return (
    <MfaModal title="Set up" {...modalProps}>
      <AkModalBody>
        <button type="button" onClick={closeModal}>
          Done
        </button>
      </AkModalBody>
    </MfaModal>
  );
}

/* Rendered the way the app renders, since the double pass is what remounts effects. */
const renderStep = (onClose: () => void) =>
  renderWithProviders(
    <StrictMode>
      <Step onClose={onClose} />
    </StrictMode>
  );

describe('MfaModal', () => {
  it('stays open once the step has mounted', async () => {
    const onClose = vi.fn();

    renderStep(onClose);

    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    expect(onClose).not.toHaveBeenCalled();
  });

  it('tells the step to unmount only after the panel has gone', async () => {
    const onClose = vi.fn();

    renderStep(onClose);

    await userEvent.click(await screen.findByRole('button', { name: 'Done' }));

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('closes from its header', async () => {
    const onClose = vi.fn();

    renderStep(onClose);

    await userEvent.click(await screen.findByRole('button', { name: akMT('close') }));

    await waitFor(() => expect(onClose).toHaveBeenCalledOnce());
  });
});

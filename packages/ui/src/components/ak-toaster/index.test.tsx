import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { AkToaster } from '@irene/ui/ak-toaster';
import { akNotify } from '@irene/ui/notify';

afterEach(() => {
  akNotify.dismiss();
});

const renderToaster = (props = {}) => render(<AkToaster {...props} />);

describe('AkToaster', () => {
  it('shows a toast raised from outside React', async () => {
    renderToaster();

    akNotify.success('Signed in');

    expect(await screen.findByText('Signed in')).toBeInTheDocument();
  });

  it.each([
    ['info', akNotify.info],
    ['warning', akNotify.warning],
    ['error', akNotify.error],
  ])('shows a %s toast', async (kind, notify) => {
    renderToaster();

    notify(`${kind} message`);

    expect(await screen.findByText(`${kind} message`)).toBeInTheDocument();
  });

  it('dismisses a toast by its id', async () => {
    renderToaster();

    const id = akNotify.info('Scan queued');

    expect(await screen.findByText('Scan queued')).toBeInTheDocument();

    akNotify.dismiss(id);

    await waitFor(() => expect(screen.queryByText('Scan queued')).not.toBeInTheDocument());
  });

  it('clears a toast when its close button is pressed', async () => {
    renderToaster();

    akNotify.error('Unable to reach the server');

    await screen.findByText('Unable to reach the server');
    await userEvent.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() =>
      expect(screen.queryByText('Unable to reach the server')).not.toBeInTheDocument()
    );
  });

  it('renders the toast as an alert, matching the inline UI', async () => {
    renderToaster();

    akNotify.error('Unable to reach the server');

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Unable to reach the server');
    expect(alert).toHaveClass('bg-danger-surface');
    expect(alert.querySelector('svg')).toBeInTheDocument();
  });

  it('shows a description under the message', async () => {
    renderToaster();

    akNotify.error('Login failed', { description: 'Invalid username or password.' });

    expect(await screen.findByText('Invalid username or password.')).toBeInTheDocument();
  });

  it('sits in the bottom right corner', async () => {
    const { container } = renderToaster();

    akNotify.info('Scan queued');
    await screen.findByText('Scan queued');

    const toaster = container.querySelector('[data-sonner-toaster]');

    expect(toaster).toHaveAttribute('data-y-position', 'bottom');
    expect(toaster).toHaveAttribute('data-x-position', 'right');
  });

  it("uses the app's own font, not sonner's system stack", async () => {
    const { container } = renderToaster();

    akNotify.info('Scan queued');
    await screen.findByText('Scan queued');

    // Inline, because sonner's stylesheet would otherwise win.
    expect(container.querySelector('[data-sonner-toaster]')).toHaveStyle({
      fontFamily: 'var(--font-sans)',
    });
  });

  it('takes an override for sonner props', async () => {
    const { container } = renderToaster({ position: 'bottom-center' });

    akNotify.info('Scan queued');
    await screen.findByText('Scan queued');

    expect(container.querySelector('[data-sonner-toaster]')).toHaveAttribute(
      'data-y-position',
      'bottom'
    );
  });
});

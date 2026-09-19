import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { AkToaster } from '@irene/ui/ak-toaster';
import { akNotify } from '@irene/ui/notify';

beforeEach(() => {
  render(<AkToaster />);
});

afterEach(() => {
  akNotify.dismiss();
  vi.useRealTimers();
});

describe('akNotify', () => {
  it.each([
    ['success', 'bg-success-surface'],
    ['info', 'bg-info-surface'],
    ['warning', 'bg-warning-surface'],
    ['error', 'bg-danger-surface'],
  ] as const)('renders a %s message in the matching alert', async (kind, surface) => {
    akNotify[kind](`${kind} message`);

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent(`${kind} message`);
    expect(alert).toHaveClass(surface);
  });

  it('renders the message with its description', async () => {
    akNotify.error('Login failed', { description: 'Invalid username or password.' });

    const alert = await screen.findByRole('alert');

    expect(alert).toHaveTextContent('Login failed');
    expect(alert).toHaveTextContent('Invalid username or password.');
  });

  it('renders a translated node, not just a string', async () => {
    akNotify.info(<span data-testid="translated">ログイン</span>);

    expect(await screen.findByTestId('translated')).toBeInTheDocument();
  });

  it('returns an id that dismisses that message', async () => {
    const id = akNotify.info('Scan queued');

    await screen.findByText('Scan queued');
    akNotify.dismiss(id);

    await waitFor(() => expect(screen.queryByText('Scan queued')).not.toBeInTheDocument());
  });

  it('dismisses every message when called with no id', async () => {
    akNotify.info('First');
    akNotify.warning('Second');

    await screen.findByText('First');
    akNotify.dismiss();

    await waitFor(() => expect(screen.queryByText('Second')).not.toBeInTheDocument());
  });

  it('closes a message from its close button', async () => {
    akNotify.warning('Trial ends in 3 days');

    await screen.findByText('Trial ends in 3 days');
    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    await waitFor(() => expect(screen.queryByText('Trial ends in 3 days')).not.toBeInTheDocument());
  });

  it('keeps a message until dismissed when asked', async () => {
    akNotify.error('Rate limit reached', { duration: Infinity });

    await screen.findByText('Rate limit reached');

    // Long enough that the default duration would have cleared it.
    await new Promise((resolve) => setTimeout(resolve, 200));

    expect(screen.getByText('Rate limit reached')).toBeInTheDocument();
  });

  it('lets a caller override how long a message stays', async () => {
    akNotify.info('Brief', { duration: 50 });

    await screen.findByText('Brief');

    await waitFor(() => expect(screen.queryByText('Brief')).not.toBeInTheDocument(), {
      timeout: 2000,
    });
  });
});

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { getStoredSession } from '@irene/api/utils/session';

import { loadConfiguration } from '@/actions/load-configuration';
import { setupUserAndOrgContext } from '@/actions/setup-user-context';

import { ScreenContext } from './screen-context';

vi.mock('@/actions/load-configuration', () => ({
  loadConfiguration: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/actions/setup-user-context', () => ({
  setupUserAndOrgContext: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@irene/api/utils/session', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@irene/api/utils/session')>()),
  getStoredSession: vi.fn(() => ({ token: 't', userId: 7, b64token: 'b' })),
}));

function renderInContext() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ScreenContext>
        <p>screen</p>
      </ScreenContext>
    </QueryClientProvider>
  );
}

describe('ScreenContext', () => {
  it('renders the screen straight away rather than holding it back', () => {
    renderInContext();

    expect(screen.getByText('screen')).toBeInTheDocument();
  });

  it('loads the configuration the screen assumes is already there', async () => {
    renderInContext();

    await waitFor(() => expect(loadConfiguration).toHaveBeenCalled());
  });

  it('fills the organization store the signed-in routes would have filled', async () => {
    renderInContext();

    await waitFor(() => expect(setupUserAndOrgContext).toHaveBeenCalledWith(expect.anything(), 7));
  });

  it('loads the configuration but no organization when nobody is signed in', async () => {
    vi.mocked(getStoredSession).mockReturnValueOnce(null);

    renderInContext();

    await waitFor(() => expect(loadConfiguration).toHaveBeenCalled());

    expect(setupUserAndOrgContext).not.toHaveBeenCalled();
  });
});

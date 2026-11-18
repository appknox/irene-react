import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { clearStoredSession, storeSession } from '@irene/api/utils/session';

import { ScreenContext } from './screen-context';

/*
  No module mocks: files share a module registry here (isolate: false), so a
  mock only applies if no other file imported the real module first. The
  session is driven through its own storage instead, which nothing else holds.
*/
function renderInContext() {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <ScreenContext>
        <p>screen</p>
      </ScreenContext>
    </QueryClientProvider>
  );
}

afterEach(() => {
  clearStoredSession();
});

describe('ScreenContext', () => {
  it('renders the screen straight away rather than holding it back', () => {
    storeSession({ token: 'tok', userId: 7, b64token: 'b64' });

    renderInContext();

    expect(screen.getByText('screen')).toBeInTheDocument();
  });

  it('renders the screen when nobody is signed in', () => {
    clearStoredSession();

    renderInContext();

    expect(screen.getByText('screen')).toBeInTheDocument();
  });

  it('keeps the screen rendered while the context it needs loads', async () => {
    storeSession({ token: 'tok', userId: 7, b64token: 'b64' });

    renderInContext();

    await waitFor(() => expect(screen.getByText('screen')).toBeInTheDocument());
  });
});

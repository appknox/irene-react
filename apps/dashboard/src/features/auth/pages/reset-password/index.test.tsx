import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
import { formatWaitTime, rateLimitStore } from '@irene/api/stores/rate-limit';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const TOKEN = 'reset-t0ken';
const RESET_URL = buildAPITestURL(AuthEndpoints.resetPassword(TOKEN));
const PAGE = `/reset/${TOKEN}`;

const INVALID_LINK_MESSAGE = akMT('invalidPasswordResetLink');

/** Answer the token check, which runs before the form is offered. */
const linkIsLive = () => server.use(http.get(RESET_URL, () => HttpResponse.json({})));

const linkIsSpent = () =>
  server.use(
    http.get(RESET_URL, () => HttpResponse.json({}, { status: HTTP_STATUS_CODES.NOT_FOUND }))
  );

const newPassword = () => screen.getByLabelText(akMT('newPassword'));
const confirm_password = () => screen.getByLabelText(akMT('confirmPassword'));

/** Fill both fields and submit. */
async function submitPasswords(password: string, confirmation = password) {
  await userEvent.type(await screen.findByLabelText(akMT('newPassword')), password);
  await userEvent.type(confirm_password(), confirmation);
  await userEvent.click(screen.getByRole('button', { name: akMT('reset') }));
}

describe('ResetPasswordPage', () => {
  it('reserves the form layout while the link check is in flight', async () => {
    let release: (() => void) | undefined;

    server.use(
      http.get(RESET_URL, async () => {
        await new Promise<void>((resolve) => {
          release = resolve;
        });

        return HttpResponse.json({});
      })
    );

    const { container } = await renderAtRoute(PAGE);
    const skeleton = () => container.querySelector('[data-test-reset-form-skeleton]');

    await waitFor(() => expect(skeleton()).toBeInTheDocument());
    expect(screen.queryByLabelText(akMT('newPassword'))).not.toBeInTheDocument();
    expect(screen.queryByText(INVALID_LINK_MESSAGE)).not.toBeInTheDocument();

    release?.();

    expect(await screen.findByLabelText(akMT('newPassword'))).toBeInTheDocument();
    expect(skeleton()).not.toBeInTheDocument();
  });

  it('renders the password form once the link checks out', async () => {
    linkIsLive();
    await renderAtRoute(PAGE);

    expect(await screen.findByLabelText(akMT('newPassword'))).toBeInTheDocument();
    expect(confirm_password()).toBeInTheDocument();
    expect(screen.queryByText(INVALID_LINK_MESSAGE)).not.toBeInTheDocument();
  });

  it('renders the invalid-link message and no form when the link is spent or unknown', async () => {
    linkIsSpent();
    await renderAtRoute(PAGE);

    expect(await screen.findByText(INVALID_LINK_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByLabelText(akMT('newPassword'))).not.toBeInTheDocument();
  });

  it('rejects a confirmation that differs from the password without sending a request', async () => {
    linkIsLive();

    let calls = 0;

    server.use(
      http.put(RESET_URL, () => {
        calls += 1;

        return HttpResponse.json({});
      })
    );

    await renderAtRoute(PAGE);
    await submitPasswords('correct-horse', 'correct-hose');

    expect(await screen.findByText(akMT('passwordMatchError'))).toBeInTheDocument();
    expect(calls).toBe(0);
  });

  it('posts password and confirm_password under the names the API expects', async () => {
    linkIsLive();

    let body: unknown;

    server.use(
      http.put(RESET_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({});
      })
    );

    await renderAtRoute(PAGE);
    await submitPasswords('correct-horse');

    await waitFor(() =>
      expect(body).toEqual({ password: 'correct-horse', confirm_password: 'correct-horse' })
    );
  });

  it('navigates to /login and renders the password-changed confirmation', async () => {
    linkIsLive();
    server.use(http.put(RESET_URL, () => HttpResponse.json({})));

    const { router } = await renderAtRoute(PAGE);

    await submitPasswords('correct-horse');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));

    expect(await screen.findByText(akMT('passwordIsReset'))).toBeInTheDocument();
  });

  it("renders the API's error on the password field", async () => {
    linkIsLive();

    server.use(
      http.put(RESET_URL, () =>
        HttpResponse.json(
          { password: ['This password is too common'] },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    const { router } = await renderAtRoute(PAGE);

    await submitPasswords('password');

    expect(await screen.findByText('This password is too common')).toBeInTheDocument();
    expect(router.state.location.pathname).toBe(PAGE);
  });

  it('renders a notification when the error names no field', async () => {
    linkIsLive();

    server.use(
      http.put(RESET_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute(PAGE);
    await submitPasswords('correct-horse');

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
  });

  it('renders the back-to-login link for both a valid and an invalid link', async () => {
    linkIsSpent();

    const { router } = await renderAtRoute(PAGE);

    await screen.findByText(INVALID_LINK_MESSAGE);
    await userEvent.click(screen.getByRole('link', { name: akMT('login') }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('renders the password inputs with type password', async () => {
    linkIsLive();
    await renderAtRoute(PAGE);

    expect(await screen.findByLabelText(akMT('newPassword'))).toHaveAttribute('type', 'password');
    expect(confirm_password()).toHaveAttribute('type', 'password');
    expect(newPassword()).toHaveAttribute('autocomplete', 'new-password');
  });

  describe('a rate-limited account', () => {
    // The lock is app-wide and outlives a render.
    // Wrapped: ending the wait updates whatever is still mounted.
    afterEach(() => act(() => rateLimitStore.getState().clearThrottle()));

    it('renders the rate-limit countdown when the reset request is throttled', async () => {
      linkIsLive();

      server.use(
        http.put(RESET_URL, () =>
          HttpResponse.json(
            { detail: { lock_time: 30 } },
            { status: HTTP_STATUS_CODES.TOO_MANY_REQUESTS }
          )
        )
      );

      await renderAtRoute(PAGE);
      await submitPasswords('a-new-passw0rd');

      expect(
        await screen.findByText(`${akMT('rateLimitExceeded')} ${formatWaitTime(30)}`)
      ).toBeInTheDocument();

      expect(screen.queryByText(akMT('somethingWentWrong'))).not.toBeInTheDocument();
    });

    it('renders no invalid-link message when the check request fails', async () => {
      server.use(
        http.get(RESET_URL, () =>
          HttpResponse.json(
            { detail: { lock_time: 30 } },
            { status: HTTP_STATUS_CODES.TOO_MANY_REQUESTS }
          )
        )
      );

      await renderAtRoute(PAGE);

      expect(await screen.findByText(akMT('resetLinkRateLimited'))).toBeInTheDocument();
      expect(screen.queryByText(INVALID_LINK_MESSAGE)).not.toBeInTheDocument();
    });

    it('disables the retry button while the rate limit is still running', async () => {
      server.use(
        http.get(RESET_URL, () =>
          HttpResponse.json(
            { detail: { lock_time: 30 } },
            { status: HTTP_STATUS_CODES.TOO_MANY_REQUESTS }
          )
        )
      );

      await renderAtRoute(PAGE);

      expect(await screen.findByRole('button', { name: akMT('retry') })).toBeDisabled();
    });
  });

  describe('a link the check request could not verify', () => {
    it.each([HTTP_STATUS_CODES.BAD_REQUEST, HTTP_STATUS_CODES.NOT_FOUND, HTTP_STATUS_CODES.GONE])(
      'calls the link invalid when the check fails with %i',
      async (status) => {
        server.use(http.get(RESET_URL, () => HttpResponse.json({}, { status })));

        await renderAtRoute(PAGE);

        expect(await screen.findByText(INVALID_LINK_MESSAGE)).toBeInTheDocument();
        expect(screen.queryByText(akMT('resetLinkRateLimited'))).not.toBeInTheDocument();
      }
    );

    it('renders the server-error message rather than the invalid-link message when the check answers 500', async () => {
      server.use(
        http.get(RESET_URL, () =>
          HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
        )
      );

      await renderAtRoute(PAGE);

      expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
      expect(screen.queryByText(INVALID_LINK_MESSAGE)).not.toBeInTheDocument();
    });

    it('renders an enabled retry button after a server error', async () => {
      server.use(
        http.get(RESET_URL, () =>
          HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
        )
      );

      await renderAtRoute(PAGE);

      expect(await screen.findByRole('button', { name: akMT('retry') })).toBeEnabled();
    });

    it('renders the password form once a retry succeeds', async () => {
      let attempts = 0;

      server.use(
        http.get(RESET_URL, () => {
          attempts += 1;

          return attempts === 1
            ? HttpResponse.json(
                { detail: { lock_time: 30 } },
                { status: HTTP_STATUS_CODES.TOO_MANY_REQUESTS }
              )
            : HttpResponse.json({ username: 'jane' });
        })
      );

      await renderAtRoute(PAGE);

      const retry = await screen.findByRole('button', { name: akMT('retry') });

      // Inside act: lifting the lock re-enables the button the click needs.
      act(() => rateLimitStore.getState().clearThrottle());

      await userEvent.click(retry);

      expect(await screen.findByLabelText(akMT('newPassword'))).toBeInTheDocument();
    });
  });
});

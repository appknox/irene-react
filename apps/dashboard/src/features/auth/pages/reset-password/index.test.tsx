import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
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
const confirmPassword = () => screen.getByLabelText(akMT('confirmPassword'));

/** Fill both fields and submit. */
async function submitPasswords(password: string, confirmation = password) {
  await userEvent.type(await screen.findByLabelText(akMT('newPassword')), password);
  await userEvent.type(confirmPassword(), confirmation);
  await userEvent.click(screen.getByRole('button', { name: akMT('reset') }));
}

describe('ResetPasswordPage', () => {
  it('holds the form shape while the link is being checked', async () => {
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

  it('offers the form once the link checks out', async () => {
    linkIsLive();
    await renderAtRoute(PAGE);

    expect(await screen.findByLabelText(akMT('newPassword'))).toBeInTheDocument();
    expect(confirmPassword()).toBeInTheDocument();
    expect(screen.queryByText(INVALID_LINK_MESSAGE)).not.toBeInTheDocument();
  });

  it('says the link is no good rather than offering a form that cannot work', async () => {
    linkIsSpent();
    await renderAtRoute(PAGE);

    expect(await screen.findByText(INVALID_LINK_MESSAGE)).toBeInTheDocument();
    expect(screen.queryByLabelText(akMT('newPassword'))).not.toBeInTheDocument();
  });

  it('refuses a confirmation that does not match, without calling the API', async () => {
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

  it('sends both fields under the names the API expects', async () => {
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

  it('returns the user to login and says the password changed', async () => {
    linkIsLive();
    server.use(http.put(RESET_URL, () => HttpResponse.json({})));

    const { router } = await renderAtRoute(PAGE);

    await submitPasswords('correct-horse');
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));

    expect(await screen.findByText(akMT('passwordIsReset'))).toBeInTheDocument();
  });

  it("puts the API's complaint on the password field", async () => {
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

  it('toasts a failure that names no field', async () => {
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

  it('offers the way back to login whether or not the link is good', async () => {
    linkIsSpent();

    const { router } = await renderAtRoute(PAGE);

    await screen.findByText(INVALID_LINK_MESSAGE);
    await userEvent.click(screen.getByRole('link', { name: akMT('login') }));

    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  it('keeps the new password out of the DOM, since it is typed in the clear otherwise', async () => {
    linkIsLive();
    await renderAtRoute(PAGE);

    expect(await screen.findByLabelText(akMT('newPassword'))).toHaveAttribute('type', 'password');
    expect(confirmPassword()).toHaveAttribute('type', 'password');
    expect(newPassword()).toHaveAttribute('autocomplete', 'new-password');
  });
});

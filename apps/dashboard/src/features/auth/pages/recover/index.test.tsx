import { faker } from '@faker-js/faker';
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

const USERNAME = faker.internet.email();
const UNKNOWN_USERNAME = faker.internet.email();
const RECOVER_API_URL = buildAPITestURL(AuthEndpoints.recover());
const SENT_MESSAGE = /Check your email for a link to reset your password/;
const usernameField = () => screen.getByLabelText(akMT('usernameEmailIdTextLabel'));

/** Ask for a reset link. */
async function requestLink(username = USERNAME) {
  await userEvent.type(usernameField(), username);
  await userEvent.click(screen.getByRole('button', { name: akMT('resetPassword') }));
}

describe('RecoverPage', () => {
  it('renders the username field', async () => {
    await renderAtRoute('/recover');

    expect(screen.getByRole('heading', { name: akMT('resetPasswordLabel') })).toBeInTheDocument();
    expect(usernameField()).toBeInTheDocument();
  });

  it('sends no request while the username is empty', async () => {
    let calls = 0;

    server.use(
      http.post(RECOVER_API_URL, () => {
        calls += 1;

        return HttpResponse.json({});
      })
    );

    await renderAtRoute('/recover');
    await userEvent.click(screen.getByRole('button', { name: akMT('resetPassword') }));

    expect(calls).toBe(0);
  });

  it('posts the username and renders the check-your-email confirmation', async () => {
    let body: unknown;

    server.use(
      http.post(RECOVER_API_URL, async ({ request }) => {
        body = await request.json();

        return HttpResponse.json({});
      })
    );

    await renderAtRoute('/recover');
    await requestLink();

    expect(await screen.findByText(SENT_MESSAGE)).toBeInTheDocument();
    expect(body).toEqual({ username: USERNAME });

    // Nothing to resubmit once the link is out.
    expect(screen.queryByRole('button', { name: akMT('resetPassword') })).not.toBeInTheDocument();
  });

  it('removes the back-to-login link once the reset link is sent', async () => {
    server.use(http.post(RECOVER_API_URL, () => HttpResponse.json({})));

    await renderAtRoute('/recover');

    expect(screen.getByRole('link', { name: akMT('login') })).toBeInTheDocument();

    await requestLink();
    await screen.findByText(SENT_MESSAGE);

    expect(screen.queryByRole('link', { name: akMT('login') })).not.toBeInTheDocument();
  });

  it("renders the API's error on the field it names", async () => {
    server.use(
      http.post(RECOVER_API_URL, () =>
        HttpResponse.json(
          { username: ['No account uses that address'] },
          { status: HTTP_STATUS_CODES.BAD_REQUEST }
        )
      )
    );

    await renderAtRoute('/recover');
    await requestLink(UNKNOWN_USERNAME);

    expect(await screen.findByText('No account uses that address')).toBeInTheDocument();
    expect(screen.queryByText(SENT_MESSAGE)).not.toBeInTheDocument();
  });

  it('renders a notification when the error names no field', async () => {
    server.use(
      http.post(RECOVER_API_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute('/recover');
    await requestLink();

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
    expect(screen.queryByText(SENT_MESSAGE)).not.toBeInTheDocument();
  });

  it('navigates to /login when the user clicks the back link', async () => {
    const { router } = await renderAtRoute('/recover');

    await userEvent.click(screen.getByRole('link', { name: akMT('login') }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });

  describe('a rate-limited account', () => {
    // The lock is app-wide and outlives a render.
    // Wrapped: ending the wait updates whatever is still mounted.
    afterEach(() => act(() => rateLimitStore.getState().clearThrottle()));

    /** Refuses the request the way a rate limiter does. */
    function throttle() {
      server.use(
        http.post(RECOVER_API_URL, () =>
          HttpResponse.json(
            { detail: { lock_time: 30 } },
            { status: HTTP_STATUS_CODES.TOO_MANY_REQUESTS }
          )
        )
      );
    }

    it('renders the rate-limit countdown', async () => {
      throttle();

      await renderAtRoute('/recover');
      await requestLink();

      expect(
        await screen.findByText(`${akMT('rateLimitExceeded')} ${formatWaitTime(30)}`)
      ).toBeInTheDocument();
    });

    it('renders no generic error alongside the countdown', async () => {
      throttle();

      await renderAtRoute('/recover');
      await requestLink();

      await screen.findByText(`${akMT('rateLimitExceeded')} ${formatWaitTime(30)}`);

      expect(screen.queryByText(akMT('somethingWentWrong'))).not.toBeInTheDocument();
    });
  });
});

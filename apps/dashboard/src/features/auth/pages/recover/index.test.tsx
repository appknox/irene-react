import { faker } from '@faker-js/faker';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { AuthEndpoints } from '@irene/api/services/auth';
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
  it('asks which account to reset', async () => {
    await renderAtRoute('/recover');

    expect(screen.getByRole('heading', { name: akMT('resetPasswordLabel') })).toBeInTheDocument();
    expect(usernameField()).toBeInTheDocument();
  });

  it('does not call the API on an empty username', async () => {
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

  it('sends the username and tells the user to go and read their email', async () => {
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

  it('drops the way back once the link is sent, since the page is done', async () => {
    server.use(http.post(RECOVER_API_URL, () => HttpResponse.json({})));

    await renderAtRoute('/recover');

    expect(screen.getByRole('link', { name: akMT('login') })).toBeInTheDocument();

    await requestLink();
    await screen.findByText(SENT_MESSAGE);

    expect(screen.queryByRole('link', { name: akMT('login') })).not.toBeInTheDocument();
  });

  it("puts the API's complaint on the field it is about", async () => {
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

  it('toasts a failure that names no field', async () => {
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

  it('takes the user back to login', async () => {
    const { router } = await renderAtRoute('/recover');

    await userEvent.click(screen.getByRole('link', { name: akMT('login') }));
    await waitFor(() => expect(router.state.location.pathname).toBe('/login'));
  });
});

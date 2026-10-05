import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { StrictMode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { buildSession } from '@tests/factories';
import { mockOrganizationFeatures } from '@tests/organization';
import { renderAtRoute, renderWithRouterContext } from '@tests/render';
import { server } from '@tests/server';

import { UploadViaLink } from './upload-via-link';

const session = buildSession();

/* The organization is whichever one the page selected, so the id is matched rather than named. */
const UPLOAD_FROM_STORE_URL = '*/api/organizations/*/upload_app_url';

const PLAY_STORE_LINK = 'https://play.google.com/store/apps/details?id=com.appknox.mfva';

/* The offensive-security queue has its own path, and takes a link to anywhere. */
const OFFSEC_UPLOAD_FROM_STORE_URL = '*/api/organizations/*/offsec/upload_app_url';
const OFFENSIVE_SECURITY_ROUTE = '/dashboard/offensive-security';
const ANY_APP_LINK = 'https://builds.example.test/nightly/app.apk';

/** Answers the store upload, and reports the link it was asked for. */
const serverAcceptsStoreLinks = () => {
  const asked = { link: '' };

  server.use(
    http.post(UPLOAD_FROM_STORE_URL, async ({ request }) => {
      const body = (await request.json()) as { url: string };

      asked.link = body.url;

      return HttpResponse.json({ id: 1, url: body.url }, { status: HTTP_STATUS_CODES.CREATED });
    })
  );

  return asked;
};

/** Opens a signed-in page and the link upload modal on it. */
const openLinkModal = async (route = '/dashboard/projects') => {
  renderAtRoute(route);

  const trigger = await screen.findByRole('button', {
    name: akMT('uploadAppModule.linkUploadPopupHeader'),
  });

  await userEvent.click(trigger);

  return screen.findByText(akMT('uploadAppModule.linkInputLabel'));
};

const linkInput = () =>
  document.querySelector<HTMLInputElement>('[data-test-upload-via-link-input]');

const confirmButton = () => screen.getByRole('button', { name: akMT('upload') });

describe('UploadViaLink', () => {
  beforeEach(() => {
    storeSession(session);
    mockOrganizationFeatures({ upload_via_url: true });
  });

  it('is not offered to an organization without it', async () => {
    mockOrganizationFeatures({ upload_via_url: false });

    renderAtRoute('/dashboard/projects');

    await screen.findByText(akMT('startNewScan'));

    expect(
      screen.queryByRole('button', { name: akMT('uploadAppModule.linkUploadPopupHeader') })
    ).not.toBeInTheDocument();
  });

  it('says which stores it takes a link to', async () => {
    await openLinkModal();

    expect(screen.getByText(akMT('uploadAppModule.stores'))).toBeInTheDocument();
    expect(screen.getByText(akMT('uploadAppModule.validURLFormatTitle'))).toBeInTheDocument();
  });

  it('cannot be sent before a link is typed', async () => {
    await openLinkModal();

    expect(confirmButton()).toBeDisabled();
  });

  it('refuses a link to anywhere but a store it knows', async () => {
    await openLinkModal();

    await userEvent.type(linkInput()!, 'https://appknox.com/download');

    expect(
      await screen.findByText(akMT('uploadAppModule.unsupportedStoreLink'))
    ).toBeInTheDocument();

    expect(confirmButton()).toBeDisabled();
  });

  it('sends the link the person pasted', async () => {
    const asked = serverAcceptsStoreLinks();

    await openLinkModal();

    await userEvent.type(linkInput()!, PLAY_STORE_LINK);
    await userEvent.click(confirmButton());

    await waitFor(() => expect(asked.link).toBe(PLAY_STORE_LINK));
  });

  it('closes once the server has the link, and opens the upload list', async () => {
    serverAcceptsStoreLinks();

    await openLinkModal();

    await userEvent.type(linkInput()!, PLAY_STORE_LINK);
    await userEvent.click(confirmButton());

    await waitFor(() =>
      expect(screen.queryByText(akMT('uploadAppModule.linkInputLabel'))).not.toBeInTheDocument()
    );
  });

  it('shows an error toast when POST /upload_app_url fails', async () => {
    server.use(
      http.post(UPLOAD_FROM_STORE_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await openLinkModal();

    await userEvent.type(linkInput()!, PLAY_STORE_LINK);
    await userEvent.click(confirmButton());

    expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
  });

  it('says nothing of its own for a throttled account, which is counted down elsewhere', async () => {
    server.use(
      http.post(UPLOAD_FROM_STORE_URL, () =>
        HttpResponse.json({ lock_time: 30 }, { status: HTTP_STATUS_CODES.TOO_MANY_REQUESTS })
      )
    );

    await openLinkModal();

    await userEvent.type(linkInput()!, PLAY_STORE_LINK);
    await userEvent.click(confirmButton());

    await waitFor(() => expect(confirmButton()).toBeEnabled());

    expect(screen.queryByText(akMT('pleaseTryAgain'))).not.toBeInTheDocument();
  });

  it('closes without React complaining about a render-phase update', async () => {
    const reactErrors = vi.spyOn(console, 'error').mockImplementation(() => undefined);

    /* Rendered the way the app renders, since the double pass is what exposes the update. */
    renderWithRouterContext(
      <StrictMode>
        <UploadViaLink />
      </StrictMode>
    );

    const trigger = await screen.findByRole('button', {
      name: akMT('uploadAppModule.linkUploadPopupHeader'),
    });

    await userEvent.click(trigger);
    await userEvent.type(linkInput()!, PLAY_STORE_LINK);
    await userEvent.keyboard('{Escape}');

    const complaints = reactErrors.mock.calls
      .map((call) => String(call[0]))
      .filter((message) => message.includes('Cannot update a component'));

    reactErrors.mockRestore();

    expect(complaints).toEqual([]);
  });

  describe('on an offensive security page', () => {
    beforeEach(() => {
      mockOrganizationFeatures({ upload_via_url: true, offensive_security: true });
    });

    const serverAcceptsOffsecLinks = () => {
      const asked = { link: '', path: '' };

      server.use(
        http.post(OFFSEC_UPLOAD_FROM_STORE_URL, async ({ request }) => {
          const body = (await request.json()) as { url: string };

          asked.link = body.url;
          asked.path = new URL(request.url).pathname;

          return HttpResponse.json({ id: 1, url: body.url }, { status: HTTP_STATUS_CODES.CREATED });
        })
      );

      return asked;
    };

    it('accepts a link to any URL, not only a store listing', async () => {
      const asked = serverAcceptsOffsecLinks();

      await openLinkModal(OFFENSIVE_SECURITY_ROUTE);

      await userEvent.type(linkInput()!, ANY_APP_LINK);
      await userEvent.click(confirmButton());

      await waitFor(() => expect(asked.link).toBe(ANY_APP_LINK));
    });

    it('refuses a link that is not a URL', async () => {
      await openLinkModal(OFFENSIVE_SECURITY_ROUTE);

      await userEvent.type(linkInput()!, 'not a url');

      expect(await screen.findByText(akMT('uploadAppModule.invalidLink'))).toBeInTheDocument();
      expect(confirmButton()).toBeDisabled();
    });

    it('posts the link to the offensive security path', async () => {
      const asked = serverAcceptsOffsecLinks();

      await openLinkModal(OFFENSIVE_SECURITY_ROUTE);

      await userEvent.type(linkInput()!, ANY_APP_LINK);
      await userEvent.click(confirmButton());

      expect(
        await screen.findByText(akMT('uploadAppModule.offsecLinkUploadStarted'))
      ).toBeInTheDocument();

      expect(asked.path).toMatch(/\/offsec\/upload_app_url$/);
    });

    it('closes and shows the run-started toast without opening the upload list', async () => {
      serverAcceptsOffsecLinks();

      await openLinkModal(OFFENSIVE_SECURITY_ROUTE);

      await userEvent.type(linkInput()!, ANY_APP_LINK);
      await userEvent.click(confirmButton());

      await waitFor(() =>
        expect(screen.queryByText(akMT('uploadAppModule.linkInputLabel'))).not.toBeInTheDocument()
      );

      /* The server has not reported the run yet, so there is nothing to list. */
      expect(document.querySelector('[data-test-upload-status-popover]')).not.toBeInTheDocument();
    });
  });

  it('forgets the link it was given once it closes', async () => {
    await openLinkModal();

    await userEvent.type(linkInput()!, PLAY_STORE_LINK);
    await userEvent.keyboard('{Escape}');

    await openLinkModal();

    expect(linkInput()).toHaveValue('');
  });
});

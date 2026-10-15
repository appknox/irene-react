import { faker } from '@faker-js/faker';
import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { UserEndpoints, type ApiUser } from '@irene/api/services/user';
import { configurationStore } from '@irene/api/stores/configuration';
import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT, getLocale, setLocale } from '@irene/translations/intl';

import {
  buildServerConfiguration,
  buildSession,
  buildUser,
  buildUserResponse,
} from '@tests/factories';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const GENERAL_SETTINGS = '/dashboard/settings/general';

const LANGUAGE_URL = buildAPITestURL(UserEndpoints.language());

const session = buildSession();

/** Answers the signed-in account with this one, so the test decides its language. */
const mockSignedInUser = (user: ApiUser) => {
  server.use(
    http.get(`*/${UserEndpoints.detail(session.userId)}`, () =>
      HttpResponse.json(buildUserResponse(user))
    )
  );
};

/** Stands in for the reload the page does once the server has the language. */
const stubReload = () => {
  const reload = vi.fn();

  vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, reload });

  return reload;
};

const languageSelect = () => screen.findByRole('combobox', { name: akMT('language') });

const pickJapanese = async () => {
  await userEvent.click(await languageSelect());
  await userEvent.click(await screen.findByRole('option', { name: akMT('languageJapanese') }));
};

describe('GeneralSettingsPage', () => {
  beforeEach(() => {
    storeSession(session);
    configurationStore.getState().setServerConfiguration(buildServerConfiguration());
    mockSignedInUser(buildUser({ lang: 'en' }));
  });

  afterEach(async () => {
    vi.restoreAllMocks();

    // Inside act: the provider re-renders the tree that is still mounted.
    await act(async () => setLocale('en'));
  });

  it('explains the language setting above the control', async () => {
    await renderAtRoute(GENERAL_SETTINGS);

    expect(await screen.findByText(akMT('selectLanguage'))).toBeInTheDocument();
    expect(await languageSelect()).toBeInTheDocument();
  });

  it('shows the language the account is set to', async () => {
    mockSignedInUser(buildUser({ lang: 'ja' }));

    await renderAtRoute(GENERAL_SETTINGS);

    expect(await languageSelect()).toHaveTextContent(akMT('languageJapanese'));
  });

  it('saves the chosen language on the account, then reloads', async () => {
    const reload = stubReload();
    let savedLanguage: string | null = null;

    server.use(
      http.post(LANGUAGE_URL, async ({ request }) => {
        savedLanguage = new URLSearchParams(await request.text()).get('lang');

        return HttpResponse.json({});
      })
    );

    await renderAtRoute(GENERAL_SETTINGS);
    await pickJapanese();

    await waitFor(() => expect(reload).toHaveBeenCalledOnce());
    expect(savedLanguage).toBe('ja');
  });

  it('switches the page to the chosen language before the server answers', async () => {
    stubReload();
    server.use(http.post(LANGUAGE_URL, () => new Promise(() => undefined)));

    await renderAtRoute(GENERAL_SETTINGS);
    await pickJapanese();

    await waitFor(() => expect(getLocale()).toBe('ja'));
    expect(await screen.findByText(akMT('selectLanguage'))).toBeInTheDocument();
  });

  it('keeps the chosen language in the control once the page has switched to it', async () => {
    stubReload();
    server.use(http.post(LANGUAGE_URL, () => new Promise(() => undefined)));

    await renderAtRoute(GENERAL_SETTINGS);
    await pickJapanese();

    await waitFor(async () =>
      expect(await languageSelect()).toHaveTextContent(akMT('languageJapanese'))
    );
  });

  it('holds the control while the language is being saved', async () => {
    stubReload();
    server.use(http.post(LANGUAGE_URL, () => new Promise(() => undefined)));

    await renderAtRoute(GENERAL_SETTINGS);
    await pickJapanese();

    await waitFor(async () => expect(await languageSelect()).toBeDisabled());
  });

  it('shows the server’s message and stays put when the language is refused', async () => {
    const reload = stubReload();
    const message = faker.lorem.sentence();

    server.use(
      http.post(LANGUAGE_URL, () =>
        HttpResponse.json({ message }, { status: HTTP_STATUS_CODES.BAD_REQUEST })
      )
    );

    await renderAtRoute(GENERAL_SETTINGS);
    await pickJapanese();

    expect(await screen.findByText(message)).toBeInTheDocument();
    expect(reload).not.toHaveBeenCalled();
  });

  it('falls back to a general message when the refusal explains nothing', async () => {
    stubReload();

    server.use(
      http.post(LANGUAGE_URL, () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
      )
    );

    await renderAtRoute(GENERAL_SETTINGS);
    await pickJapanese();

    expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
  });
});

import { faker } from '@faker-js/faker';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { PersonalTokenEndpoints, type ApiPersonalToken } from '@irene/api/services/personal-token';
import { configurationStore } from '@irene/api/stores/configuration';
import { storeSession } from '@irene/api/utils/session';
import { HTTP_STATUS_CODES } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import {
  buildPersonalToken,
  buildServerConfiguration,
  buildSession,
  toPersonalTokenResource,
} from '@tests/factories';

import { renderAtRoute } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';

const DEVELOPER_SETTINGS = '/dashboard/settings/developersettings';

const LIST_URL = buildAPITestURL(PersonalTokenEndpoints.list());

/** Answers the list with these tokens, until the test answers it again. */
const mockTokens = (tokens: ApiPersonalToken[]) => {
  server.use(
    http.get(LIST_URL, () => HttpResponse.json({ data: tokens.map(toPersonalTokenResource) }))
  );
};

/** A JSON:API refusal carrying one complaint. */
const jsonApiRefusal = (complaint: { code?: string; detail?: string }) =>
  HttpResponse.json({ errors: [complaint] }, { status: HTTP_STATUS_CODES.BAD_REQUEST });

const nameInput = () => screen.findByRole('textbox', { name: akMT('name') });

const generate = async (name: string) => {
  await userEvent.type(await nameInput(), name);
  await userEvent.click(screen.getByRole('button', { name: akMT('personalAccessTokenCreate') }));
};

const tokenRow = async (token: ApiPersonalToken) => {
  const cell = await screen.findByText(token.name);
  const row = cell.closest('tr');

  if (!row) {
    throw new Error(`No row for ${token.name}`);
  }

  return row;
};

describe('DeveloperSettingsPage', () => {
  beforeEach(() => {
    storeSession(buildSession());
    configurationStore.getState().setServerConfiguration(buildServerConfiguration());
    mockTokens([]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('the list of tokens', () => {
    it('shows no table until the account has a token', async () => {
      await renderAtRoute(DEVELOPER_SETTINGS);

      expect(await nameInput()).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('lists each token with its name and key', async () => {
      const tokens = [buildPersonalToken(), buildPersonalToken()];

      mockTokens(tokens);

      await renderAtRoute(DEVELOPER_SETTINGS);

      for (const token of tokens) {
        const row = await tokenRow(token);

        expect(within(row).getByText(token.key)).toBeInTheDocument();
      }
    });

    it('leaves the date blank rather than writing "Invalid Date" when the server sends one it cannot read', async () => {
      const token = buildPersonalToken({ created: 'not-a-date' });

      mockTokens([token]);

      await renderAtRoute(DEVELOPER_SETTINGS);

      expect(await tokenRow(token)).not.toHaveTextContent('Invalid Date');
    });
  });

  describe('generating a token', () => {
    it('sends the name, then lists the new token', async () => {
      const token = buildPersonalToken();
      let body: unknown;

      server.use(
        http.post(LIST_URL, async ({ request }) => {
          body = await request.json();
          mockTokens([token]);

          return HttpResponse.json({ data: toPersonalTokenResource(token) });
        })
      );

      await renderAtRoute(DEVELOPER_SETTINGS);
      await generate(token.name);

      expect(await tokenRow(token)).toBeInTheDocument();
      expect(body).toEqual({ name: token.name });
      expect(await screen.findByText(akMT('personalTokenGenerated'))).toBeInTheDocument();
      expect(await nameInput()).toHaveValue('');
    });

    it('asks for a name rather than sending one that is only spaces', async () => {
      let wasSent = false;

      server.use(
        http.post(LIST_URL, () => {
          wasSent = true;

          return HttpResponse.json({});
        })
      );

      await renderAtRoute(DEVELOPER_SETTINGS);
      await generate('   ');

      expect(await screen.findByText(akMT('enterTokenName'))).toBeInTheDocument();
      expect(wasSent).toBe(false);
    });

    it('says so under the field when the name is already taken', async () => {
      server.use(http.post(LIST_URL, () => jsonApiRefusal({ code: 'unique', detail: 'taken' })));

      await renderAtRoute(DEVELOPER_SETTINGS);
      await generate(faker.word.words(2));

      expect(await screen.findByText(akMT('personalTokenNameDuplicate'))).toBeInTheDocument();
    });

    it('shows any other refusal as the server words it', async () => {
      const detail = faker.lorem.sentence();

      server.use(http.post(LIST_URL, () => jsonApiRefusal({ code: 'invalid', detail })));

      await renderAtRoute(DEVELOPER_SETTINGS);
      await generate(faker.word.words(2));

      expect(await screen.findByText(detail)).toBeInTheDocument();
    });

    it('says something went wrong when the refusal explains nothing', async () => {
      server.use(
        http.post(LIST_URL, () =>
          HttpResponse.json({}, { status: HTTP_STATUS_CODES.INTERNAL_SERVER_ERROR })
        )
      );

      await renderAtRoute(DEVELOPER_SETTINGS);
      await generate(faker.word.words(2));

      expect(await screen.findByText(akMT('somethingWentWrong'))).toBeInTheDocument();
    });
  });

  describe('copying a key', () => {
    it('puts the key on the clipboard and says so', async () => {
      const user = userEvent.setup();
      const token = buildPersonalToken();

      mockTokens([token]);

      await renderAtRoute(DEVELOPER_SETTINGS);

      await user.click(
        within(await tokenRow(token)).getByRole('button', { name: `${akMT('copy')} ${token.name}` })
      );

      expect(await screen.findByText(akMT('tokenCopied'))).toBeInTheDocument();
      await expect(navigator.clipboard.readText()).resolves.toBe(token.key);
    });

    it('says so when the browser refuses the clipboard', async () => {
      const user = userEvent.setup();
      const token = buildPersonalToken();

      mockTokens([token]);
      vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));

      await renderAtRoute(DEVELOPER_SETTINGS);

      await user.click(
        within(await tokenRow(token)).getByRole('button', { name: `${akMT('copy')} ${token.name}` })
      );

      expect(await screen.findByText(akMT('pleaseTryAgain'))).toBeInTheDocument();
    });
  });

  describe('revoking a token', () => {
    const openRevoke = async (token: ApiPersonalToken) => {
      await userEvent.click(
        within(await tokenRow(token)).getByRole('button', {
          name: `${akMT('delete')} ${token.name}`,
        })
      );

      return screen.findByRole('dialog');
    };

    it('asks first, then revokes the token and drops it from the list', async () => {
      const token = buildPersonalToken();
      let wasRevoked = false;

      mockTokens([token]);

      server.use(
        http.delete(buildAPITestURL(PersonalTokenEndpoints.detail(token.id)), () => {
          wasRevoked = true;
          mockTokens([]);

          return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
        })
      );

      await renderAtRoute(DEVELOPER_SETTINGS);

      const dialog = await openRevoke(token);

      expect(dialog).toHaveTextContent(akMT('confirmBox.revokePersonalToken'));
      expect(wasRevoked).toBe(false);

      await userEvent.click(within(dialog).getByRole('button', { name: akMT('delete') }));

      expect(await screen.findByText(akMT('personalTokenRevoked'))).toBeInTheDocument();
      await waitFor(() => expect(screen.queryByText(token.name)).not.toBeInTheDocument());
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('keeps the token when the user cancels', async () => {
      const token = buildPersonalToken();

      mockTokens([token]);

      await renderAtRoute(DEVELOPER_SETTINGS);

      const dialog = await openRevoke(token);

      await userEvent.click(within(dialog).getByRole('button', { name: akMT('cancel') }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByText(token.name)).toBeInTheDocument();
    });

    it('shows the server’s refusal and keeps the modal open', async () => {
      const token = buildPersonalToken();
      const detail = faker.lorem.sentence();

      mockTokens([token]);

      server.use(
        http.delete(buildAPITestURL(PersonalTokenEndpoints.detail(token.id)), () =>
          jsonApiRefusal({ detail })
        )
      );

      await renderAtRoute(DEVELOPER_SETTINGS);

      const dialog = await openRevoke(token);

      await userEvent.click(within(dialog).getByRole('button', { name: akMT('delete') }));

      expect(await screen.findByText(detail)).toBeInTheDocument();
      expect(screen.getByRole('dialog')).toBeInTheDocument();
    });
  });
});

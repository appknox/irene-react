import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { akMT, setLocale } from '@irene/translations/intl';
import { renderAtRoute } from '@tests/render';

/** Picks Japanese from the switcher, as a reader on the login page would. */
const switchToJapanese = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('combobox', { name: akMT('language') }));
  await user.click(await screen.findByRole('option', { name: akMT('languageJapanese') }));
};

afterEach(async () => {
  // Inside act: the provider re-renders the tree that is still mounted.
  await act(async () => setLocale('en'));
});

describe('switching the locale on /login', () => {
  it('renders the heading in the picked locale', async () => {
    const user = userEvent.setup();

    await renderAtRoute('/login');

    await switchToJapanese(user);

    await waitFor(() => {
      expect(screen.getByText('アカウントにログインする')).toBeInTheDocument();
    });
  });

  it('renders the field label and placeholder in the picked locale', async () => {
    const user = userEvent.setup();

    await renderAtRoute('/login');

    await switchToJapanese(user);

    await waitFor(() => {
      expect(screen.getByLabelText('ユーザー名／メールアドレス')).toBeInTheDocument();
    });

    expect(
      screen.getByPlaceholderText('ユーザー名またはメールアドレスを入力してください')
    ).toBeInTheDocument();
  });

  it('renders the document title in the picked locale', async () => {
    const user = userEvent.setup();

    await renderAtRoute('/login');

    await switchToJapanese(user);

    await waitFor(() => expect(document.title).toContain(akMT('login')));
  });
});

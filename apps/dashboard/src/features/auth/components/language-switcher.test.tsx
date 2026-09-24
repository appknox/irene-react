import { act, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';

import { akMT, getLocale, setLocale } from '@irene/translations/intl';
import { getStoredLocale } from '@irene/translations/locale';

import { LanguageSwitcher } from '@/features/auth/components/language-switcher';
import { renderWithProviders } from '@tests/render';

afterEach(async () => {
  // Inside act: the provider re-renders the tree that is still mounted.
  await act(async () => setLocale('en'));
});

describe('LanguageSwitcher', () => {
  it('shows the active locale as the selected value', () => {
    renderWithProviders(<LanguageSwitcher />);

    expect(screen.getByRole('combobox')).toHaveTextContent(akMT('languageEnglish'));
  });

  it('labels the trigger Language', () => {
    renderWithProviders(<LanguageSwitcher />);

    expect(screen.getByRole('combobox')).toHaveAccessibleName(akMT('language'));
  });

  it('lists every supported locale under its own endonym', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LanguageSwitcher />);

    await user.click(screen.getByRole('combobox'));

    expect(
      await screen.findByRole('option', { name: akMT('languageEnglish') })
    ).toBeInTheDocument();

    expect(screen.getByRole('option', { name: akMT('languageJapanese') })).toBeInTheDocument();
  });

  it('sets the locale to the option the user picks', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LanguageSwitcher />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: akMT('languageJapanese') }));

    await waitFor(() => expect(getLocale()).toBe('ja'));
  });

  it('writes the picked locale to localStorage', async () => {
    const user = userEvent.setup();

    renderWithProviders(<LanguageSwitcher />);

    await user.click(screen.getByRole('combobox'));
    await user.click(await screen.findByRole('option', { name: akMT('languageJapanese') }));

    expect(getStoredLocale()).toBe('ja');
  });
});

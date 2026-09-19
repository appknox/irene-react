import { act, render, screen } from '@testing-library/react';
import { FormattedMessage, useIntl } from 'react-intl';
import { afterEach, describe, expect, it } from 'vitest';

import { setLocale } from '@irene/translations/intl';
import { TranslationsProvider } from '@irene/translations/provider';

afterEach(async () => {
  await act(() => setLocale('en'));
});

function LoginTitle() {
  const intl = useIntl();

  return <h1>{intl.formatMessage({ id: 'loginTitle' })}</h1>;
}

describe('TranslationsProvider', () => {
  it('renders messages in English by default', () => {
    render(
      <TranslationsProvider>
        <LoginTitle />
      </TranslationsProvider>
    );

    expect(screen.getByRole('heading')).toHaveTextContent('Login to your account');
  });

  it('re-renders in the new locale when it changes', async () => {
    render(
      <TranslationsProvider>
        <FormattedMessage id="login" />
      </TranslationsProvider>
    );

    expect(screen.getByText('Login')).toBeInTheDocument();

    await act(() => setLocale('ja'));

    expect(screen.queryByText('Login')).not.toBeInTheDocument();
    expect(screen.getByText('ログイン')).toBeInTheDocument();
  });

  it('renders markup as elements without the call site passing tags', () => {
    const { container } = render(
      <TranslationsProvider>
        <FormattedMessage id="uploadNewProject" />
      </TranslationsProvider>
    );

    expect(container.querySelector('b')).toHaveTextContent('Upload App');
    expect(container).not.toHaveTextContent('<b>');
  });

  it('renders line breaks as elements', () => {
    const { container } = render(
      <TranslationsProvider>
        <FormattedMessage id="capturedApiEmptyDesc" />
      </TranslationsProvider>
    );

    expect(container.querySelectorAll('br')).toHaveLength(2);
  });
});

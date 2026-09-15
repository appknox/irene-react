import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { ReactNode } from 'react';

import { AkMessageTranslate } from '@irene/translations/ak-message-translate';
import { setLocale } from '@irene/translations/intl';
import { TranslationsProvider } from '@irene/translations/provider';

afterEach(async () => {
  await act(() => setLocale('en'));
});

const renderInProvider = (ui: ReactNode) =>
  render(<TranslationsProvider>{ui}</TranslationsProvider>);

describe('AkMessageTranslate', () => {
  it('renders a plain message', () => {
    renderInProvider(<AkMessageTranslate id="login" />);

    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('fills in arguments', () => {
    renderInProvider(<AkMessageTranslate id="monthWithNum" values={{ numMonths: 3 }} />);

    expect(screen.getByText('3 Months')).toBeInTheDocument();
  });

  it('renders markup as elements', () => {
    const { container } = renderInProvider(
      <AkMessageTranslate id="apiScanModule.reportRegenerateText" values={{ reportType: 'PDF' }} />
    );

    expect(container.querySelector('strong')).toHaveTextContent('"PDF"');
  });

  it('renders line breaks as elements', () => {
    const { container } = renderInProvider(<AkMessageTranslate id="capturedApiEmptyDesc" />);

    expect(container.querySelectorAll('br')).toHaveLength(2);
  });

  it('re-renders when the locale changes', async () => {
    renderInProvider(<AkMessageTranslate id="login" />);

    await act(() => setLocale('ja'));

    expect(screen.getByText('ログイン')).toBeInTheDocument();
  });
});

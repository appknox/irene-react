import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { LoginFailureKind } from '@/features/auth/utils/login-error';
import { renderWithProviders } from '@tests/render';

import { LoginRefusalMessage } from './login-refusal-message';

describe('LoginRefusalMessage', () => {
  it('renders the wrong-password message', () => {
    renderWithProviders(<LoginRefusalMessage failure={{ kind: LoginFailureKind.CREDENTIALS }} />);

    expect(screen.getByText(akMT('credentialsIncorrect'))).toBeVisible();
  });

  it('renders the account-locked message with the password reset link', () => {
    renderWithProviders(<LoginRefusalMessage failure={{ kind: LoginFailureKind.LOCKED }} />);

    expect(document.querySelector('[data-test-account-locked-message]')).toHaveTextContent(
      akMT('lockedAccount')
    );
  });

  it('renders nothing for a login error carried by a notification', () => {
    const { container } = renderWithProviders(<LoginRefusalMessage />);

    expect(container).toBeEmptyDOMElement();
  });
});

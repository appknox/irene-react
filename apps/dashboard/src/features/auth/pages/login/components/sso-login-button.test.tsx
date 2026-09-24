import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { SsoLoginButton } from '@/features/auth/pages/login/components/sso-login-button';
import { renderWithProviders } from '@tests/render';

describe('SsoLoginButton', () => {
  it('renders a button with the SSO label', () => {
    renderWithProviders(<SsoLoginButton />);

    expect(screen.getByRole('button', { name: akMT('ssoLogin') })).toBeInTheDocument();
  });

  it('renders type button when the account may also use a password', () => {
    renderWithProviders(<SsoLoginButton />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('renders type submit when the organization enforces SSO', () => {
    renderWithProviders(<SsoLoginButton isEnforced />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('starts the provider redirect when the user clicks it', async () => {
    const onClick = vi.fn();

    renderWithProviders(<SsoLoginButton onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('disables itself while the redirect request is in flight', async () => {
    const onClick = vi.fn();

    renderWithProviders(<SsoLoginButton loading onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

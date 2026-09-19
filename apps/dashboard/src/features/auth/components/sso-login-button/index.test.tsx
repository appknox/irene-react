import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { SsoLoginButton } from '@/features/auth/components/sso-login-button';
import { renderWithProviders } from '@tests/render';

describe('SsoLoginButton', () => {
  it('reads as a button the user can press', () => {
    renderWithProviders(<SsoLoginButton />);

    expect(screen.getByRole('button', { name: akMT('ssoLogin') })).toBeInTheDocument();
  });

  it('is a plain button when SSO is one option among others', () => {
    renderWithProviders(<SsoLoginButton />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'button');
  });

  it('submits the form when the organisation allows nothing but SSO', () => {
    renderWithProviders(<SsoLoginButton isEnforced />);

    expect(screen.getByRole('button')).toHaveAttribute('type', 'submit');
  });

  it('starts the redirect when pressed', async () => {
    const onClick = vi.fn();

    renderWithProviders(<SsoLoginButton onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));

    expect(onClick).toHaveBeenCalledOnce();
  });

  it('blocks a second press while the redirect is being prepared', async () => {
    const onClick = vi.fn();

    renderWithProviders(<SsoLoginButton loading onClick={onClick} />);
    await userEvent.click(screen.getByRole('button'));

    expect(onClick).not.toHaveBeenCalled();
    expect(screen.getByRole('button')).toBeDisabled();
  });
});

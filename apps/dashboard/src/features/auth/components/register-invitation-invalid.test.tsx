import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { APPKNOX_SUPPORT_EMAIL } from '@irene/constants';
import { akMT } from '@irene/translations/intl';

import { renderWithProviders } from '@tests/render';

import { RegisterInvitationInvalid } from './register-invitation-invalid';

/** Builds this deployment as a whitelabel one, which is a build-time flag. */
const whitelabelBuild = () => {
  globalThis.__BUILD_CONFIG__ = { WHITELABEL_ENABLED: 'true' };
};

describe('RegisterInvitationInvalid', () => {
  afterEach(() => {
    globalThis.__BUILD_CONFIG__ = {};
  });

  it('renders the support address as a mailto link on an Appknox host', () => {
    renderWithProviders(<RegisterInvitationInvalid />);

    expect(screen.getByRole('link', { name: akMT('supportLink') })).toHaveAttribute(
      'href',
      `mailto:${APPKNOX_SUPPORT_EMAIL}`
    );
  });

  it('renders the support address as plain text on a whitelabel host', () => {
    whitelabelBuild();

    renderWithProviders(<RegisterInvitationInvalid />);

    expect(screen.getByText(akMT('supportLink'))).toBeVisible();
    expect(screen.queryByRole('link', { name: akMT('supportLink') })).not.toBeInTheDocument();
  });
});

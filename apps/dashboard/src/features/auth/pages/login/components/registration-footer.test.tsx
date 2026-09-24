import { screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { configurationStore } from '@irene/api/stores/configuration';
import { akMT } from '@irene/translations/intl';

import { buildFrontendConfiguration } from '@tests/factories';
import { renderWithProviders } from '@tests/render';

import { RegistrationFooter } from './registration-footer';

/** Answers the frontend configuration, which is what decides the footer. */
const deploymentAllowsRegistration = (registrationEnabled: boolean) => {
  configurationStore.getState().setFrontendConfiguration(
    buildFrontendConfiguration({
      registration_enabled: registrationEnabled,
      registration_link: '',
    })
  );
};

describe('RegistrationFooter', () => {
  afterEach(() => {
    configurationStore.setState(configurationStore.getInitialState(), true);
  });

  it('reserves one line of height while the frontend configuration request is in flight', () => {
    renderWithProviders(<RegistrationFooter />);

    expect(document.querySelector('[data-test-registration-footer-pending]')).toBeInTheDocument();
  });

  it('renders the registration link when registration_enabled is true', () => {
    deploymentAllowsRegistration(true);

    renderWithProviders(<RegistrationFooter />);

    expect(screen.getByRole('link', { name: akMT('registerToday') })).toHaveAttribute(
      'href',
      '/register'
    );
  });

  it('renders nothing when registration_enabled is false', () => {
    deploymentAllowsRegistration(false);

    const { container } = renderWithProviders(<RegistrationFooter />);

    expect(container).toBeEmptyDOMElement();
  });
});

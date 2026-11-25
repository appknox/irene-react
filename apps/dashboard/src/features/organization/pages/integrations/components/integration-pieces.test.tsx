import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { IntegratedAccount } from './integrated-account';
import { IntegrationCard } from './integration-card';
import { IntegrationDrawer } from './integration-drawer';

const CARD = {
  id: 'Jira',
  title: 'Jira',
  description: 'Tracks work',
  logo: '/jira-icon.png',
  isIntegrated: true,
};

describe('IntegrationCard', () => {
  it('carries one control of its own where the service is chosen rather than managed', async () => {
    const user = userEvent.setup();
    const onIntegrate = vi.fn();

    render(
      <IntegrationCard
        data={{ ...CARD, showSelectButton: true, selectButtonText: 'Select project' }}
        onIntegrate={onIntegrate}
      />
    );

    expect(screen.queryByText(akMT('integrated'))).not.toBeInTheDocument();
    expect(screen.queryByText(akMT('manage'))).not.toBeInTheDocument();

    await user.click(screen.getByText('Select project'));

    expect(onIntegrate).toHaveBeenCalled();
  });

  it('holds its own shape while the connection is read', () => {
    render(<IntegrationCard data={CARD} isLoading onIntegrate={vi.fn()} />);

    expect(document.querySelector('[data-test-integration-card-loading]')).not.toBeNull();
    expect(screen.queryByText(CARD.title)).not.toBeInTheDocument();
  });
});

describe('IntegrationDrawer', () => {
  it('offers save rather than integrate while a connection is being changed', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(
      <IntegrationDrawer
        isOpen
        isEditing
        title="Jira"
        onSave={vi.fn()}
        onEdit={onEdit}
        onClose={vi.fn()}
      >
        <p>Connection</p>
      </IntegrationDrawer>
    );

    expect(screen.queryByText(akMT('integrate'))).not.toBeInTheDocument();

    await user.click(screen.getByText(akMT('save')));

    expect(onEdit).toHaveBeenCalled();
  });

  it('closes on cancel, leaving the connection as it was', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <IntegrationDrawer isOpen title="Jira" onSave={vi.fn()} onClose={onClose}>
        <p>Connection</p>
      </IntegrationDrawer>
    );

    await user.click(screen.getByText(akMT('cancel')));

    expect(onClose).toHaveBeenCalled();
  });

  it('carries no controls where the pane inside it has its own', () => {
    render(
      <IntegrationDrawer isOpen noFooter title="Jira" onSave={vi.fn()} onClose={vi.fn()}>
        <p>Connection</p>
      </IntegrationDrawer>
    );

    expect(screen.queryByText(akMT('integrate'))).not.toBeInTheDocument();
    expect(screen.queryByText(akMT('cancel'))).not.toBeInTheDocument();
    expect(screen.getByText('Connection')).toBeInTheDocument();
  });
});

describe('IntegratedAccount', () => {
  it('names the instance a connection points at where the service has one', () => {
    render(
      <IntegratedAccount
        logo="/jira-icon.png"
        logoAlt="Jira"
        hostUrl="https://acme.atlassian.net"
        propertyTitle={akMT('username')}
        property="ali"
      />
    );

    expect(screen.getByText(akMT('instanceURL'))).toBeInTheDocument();
    expect(screen.getByText('https://acme.atlassian.net')).toBeInTheDocument();
    expect(screen.getByText('ali')).toBeInTheDocument();
  });

  it('leaves the instance out for a service that is not hosted per customer', () => {
    render(
      <IntegratedAccount
        logo="/slack-icon.png"
        logoAlt="Slack"
        propertyTitle={akMT('slack.channelId')}
        property="C123"
      />
    );

    expect(screen.queryByText(akMT('instanceURL'))).not.toBeInTheDocument();
    expect(screen.getByText('C123')).toBeInTheDocument();
  });

  it('holds its shape while the connection is read', () => {
    render(
      <IntegratedAccount
        isLoading
        logo="/slack-icon.png"
        logoAlt="Slack"
        propertyTitle={akMT('slack.channelId')}
        property="C123"
      />
    );

    expect(screen.queryByText('C123')).not.toBeInTheDocument();
    expect(document.querySelector('[data-test-integrated-account-logo]')).toBeNull();
  });

  it('offers the way to change a connection where there is one to change', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    render(
      <IntegratedAccount
        logo="/slack-icon.png"
        logoAlt="Slack"
        propertyTitle={akMT('slack.channelId')}
        property="C123"
        onEdit={onEdit}
      />
    );

    await user.click(screen.getByLabelText(akMT('edit')));

    expect(onEdit).toHaveBeenCalled();
  });
});

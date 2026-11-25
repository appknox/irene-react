import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SERVICE_ACCOUNT_TYPE, type ApiServiceAccount } from '@irene/api/services/service-account';
import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { DateTimeFormat, formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { TranslationsProvider } from '@irene/translations/provider';
import { AkFormProvider } from '@irene/ui/ak-form';

import {
  buildOrganization,
  buildOrganizationMe,
  buildOrganizationUser,
  buildSession,
} from '@tests/factories';

import { renderAtAddress } from '@tests/render';
import { server } from '@tests/server';

import { NO_SCOPES } from '../scopes';
import { AccessTokenSection } from './access-token';
import { AccountOverviewSection } from './account-overview';
import type { ServiceAccountFormSchema } from '../schemas/create';

const ACCOUNT: ApiServiceAccount = {
  id: 9,
  name: 'CI uploads',
  description: 'Used by the build',
  access_key_id: 'AKIAEXAMPLE',
  expiry: '2026-12-31T00:00:00Z',
  is_expired: false,
  is_active: true,
  all_projects: true,
  service_account_type: SERVICE_ACCOUNT_TYPE.user,
  created_on: '2026-01-01T00:00:00Z',
  updated_on: '2026-01-02T00:00:00Z',
  created_by_user: 3,
  updated_by_user: null,
  ...NO_SCOPES,
};

/** The overview open for changes, which reads its fields from the form around it. */
function OpenOverview() {
  const form = useForm<ServiceAccountFormSchema>({
    defaultValues: { name: ACCOUNT.name, description: ACCOUNT.description },
  });

  return (
    <AkFormProvider {...form}>
      <form noValidate>
        <AccountOverviewSection
          serviceAccount={ACCOUNT}
          isEditing
          onSave={vi.fn()}
          onCancel={vi.fn()}
        />
      </form>
    </AkFormProvider>
  );
}

/** The token section as the account's own screen drives it. */
function TokenSection({ account = ACCOUNT }: Readonly<{ account?: ApiServiceAccount }>) {
  const [isEditing, setIsEditing] = useState(false);

  return (
    <TranslationsProvider>
      <AccessTokenSection
        serviceAccount={account}
        isEditing={isEditing}
        expiryInDays={30}
        doesNotExpire={false}
        onExpiryInDaysChange={vi.fn()}
        onDoesNotExpireChange={vi.fn()}
        onEdit={() => setIsEditing(true)}
        onRegenerate={vi.fn()}
        onCancel={() => setIsEditing(false)}
      />
    </TranslationsProvider>
  );
}

beforeEach(() => {
  clearStoredSession();
  storeSession(buildSession());

  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ is_owner: true, is_admin: true }));

  server.use(
    http.get('*/api/organizations/:organizationId/users/:userId', () =>
      HttpResponse.json(buildOrganizationUser({ username: 'ali', email: 'ali@example.test' }))
    )
  );
});

describe('the account overview, on an account that exists', () => {
  it('reads the name and description rather than asking for them', async () => {
    renderAtAddress(
      <AccountOverviewSection serviceAccount={ACCOUNT} onEdit={vi.fn()} />,
      '/dashboard/organization/settings/service-account/9'
    );

    expect(await screen.findByText('CI uploads')).toBeInTheDocument();
    expect(screen.getByText('Used by the build')).toBeInTheDocument();
    expect(document.querySelector('[data-test-service-account-name-input]')).toBeNull();
  });

  it('carries the audit of who made it', async () => {
    renderAtAddress(
      <AccountOverviewSection serviceAccount={ACCOUNT} onEdit={vi.fn()} />,
      '/dashboard/organization/settings/service-account/9'
    );

    await screen.findByText('CI uploads');

    expect(document.querySelector('[data-test-service-account-audit]')).not.toBeNull();
  });

  it('offers the way to open it, and the controls once it is open', async () => {
    const user = userEvent.setup();
    const onEdit = vi.fn();

    renderAtAddress(
      <AccountOverviewSection serviceAccount={ACCOUNT} onEdit={onEdit} />,
      '/dashboard/organization/settings/service-account/9'
    );

    await user.click(await screen.findByLabelText(`${akMT('edit')} ${akMT('accountOverview')}`));

    expect(onEdit).toHaveBeenCalled();
  });

  it('shows the fields and the controls while it is open', async () => {
    /* Open, the section is a form again, so it reads its fields from one. */
    renderAtAddress(<OpenOverview />, '/dashboard/organization/settings/service-account/9');

    expect(await screen.findByText(akMT('update'))).toBeInTheDocument();
    expect(screen.getByText(akMT('cancel'))).toBeInTheDocument();
  });
});

describe('the access token, on an account that exists', () => {
  it('reads the key, the masked secret and when it expires', () => {
    render(<TokenSection />);

    expect(screen.getByText('AKIAEXAMPLE')).toBeInTheDocument();

    expect(document.querySelector('[data-test-service-account-secret-masked]')).not.toBeNull();

    expect(screen.getByText(formatDateTime(ACCOUNT.expiry, DateTimeFormat.ll))).toBeInTheDocument();
  });

  it('says the token never expires where it does not', () => {
    render(<TokenSection account={{ ...ACCOUNT, expiry: null }} />);

    expect(screen.getByText(akMT('noExpiry'))).toBeInTheDocument();
  });

  it('shows the secret where one has just been minted, and says to copy it', () => {
    render(
      <TranslationsProvider>
        <AccessTokenSection
          serviceAccount={ACCOUNT}
          secret="shh"
          expiryInDays={30}
          doesNotExpire={false}
          onExpiryInDaysChange={vi.fn()}
          onDoesNotExpireChange={vi.fn()}
        />
      </TranslationsProvider>
    );

    expect(screen.getByText('shh')).toBeInTheDocument();

    expect(
      screen.getByText(akMT('serviceAccountModule.unmaskedSecretAccessKeyHelperText'))
    ).toBeInTheDocument();
  });

  it('carries the audit of the last change where there was one', async () => {
    renderAtAddress(
      <AccountOverviewSection
        serviceAccount={{ ...ACCOUNT, updated_by_user: 4 }}
        onEdit={vi.fn()}
      />,
      '/dashboard/organization/settings/service-account/9'
    );

    expect(await screen.findByText('CI uploads')).toBeInTheDocument();
    expect(document.querySelector('[data-test-service-account-audit]')).not.toBeNull();
  });

  it('asks for the new expiry once a fresh key is wanted', async () => {
    const user = userEvent.setup();

    render(<TokenSection />);

    await user.click(screen.getByLabelText(akMT('serviceAccountModule.refreshAccessToken')));

    expect(
      screen.getByText(akMT('serviceAccountModule.accessTokenEditDescription'))
    ).toBeInTheDocument();

    expect(screen.getByText(akMT('serviceAccountModule.regenerateKey'))).toBeInTheDocument();
  });
});

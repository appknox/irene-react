import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';

import { DateTimeFormat, formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { TranslationsProvider } from '@irene/translations/provider';

import { DEFAULT_EXPIRY_IN_DAYS, expiryDateIn } from '../expiry';
import { AccessTokenSection } from './access-token';

/** The section as the create screen drives it, with the expiry held above it. */
function TokenSection() {
  const [expiryInDays, setExpiryInDays] = useState(DEFAULT_EXPIRY_IN_DAYS);
  const [doesNotExpire, setDoesNotExpire] = useState(false);

  /* The note carries a date inside a message, which reads it through the provider. */
  return (
    <TranslationsProvider>
      <AccessTokenSection
        expiryInDays={expiryInDays}
        onExpiryInDaysChange={setExpiryInDays}
        doesNotExpire={doesNotExpire}
        onDoesNotExpireChange={setDoesNotExpire}
      />
    </TranslationsProvider>
  );
}

const daysField = () =>
  document.querySelector('[data-test-service-account-expiry-days]') as HTMLInputElement;

describe('the access token section', () => {
  it('says the token is only shown once the account is saved', () => {
    render(<TokenSection />);

    expect(
      screen.getByText(akMT('serviceAccountModule.accessTokenCreateDescription'))
    ).toBeInTheDocument();
  });

  it('opens on thirty days and names the date the token would expire', () => {
    render(<TokenSection />);

    expect(daysField()).toHaveValue(String(DEFAULT_EXPIRY_IN_DAYS));

    const expiry = formatDateTime(expiryDateIn(DEFAULT_EXPIRY_IN_DAYS), DateTimeFormat.ll);

    expect(document.querySelector('[data-test-service-account-expiry-note]')).toHaveTextContent(
      expiry
    );
  });

  it('counts the days up and down', async () => {
    const user = userEvent.setup();

    render(<TokenSection />);

    await user.click(screen.getByLabelText(akMT('increase')));

    expect(daysField()).toHaveValue('31');

    await user.click(screen.getByLabelText(akMT('decrease')));

    expect(daysField()).toHaveValue('30');
  });

  it('never counts below a day', async () => {
    const user = userEvent.setup();

    render(<TokenSection />);

    await user.tripleClick(daysField());
    await user.keyboard('0');

    expect(daysField()).toHaveValue('1');
    expect(screen.getByLabelText(akMT('decrease'))).toBeDisabled();
  });

  it('reads anything that is not a number as a single day', async () => {
    const user = userEvent.setup();

    render(<TokenSection />);

    await user.clear(daysField());

    expect(daysField()).toHaveValue('1');
  });

  it('closes the field and says the token lasts where it does not expire', async () => {
    const user = userEvent.setup();

    render(<TokenSection />);

    await user.click(screen.getByLabelText(akMT('serviceAccountModule.doesNotExpire')));

    expect(daysField()).toBeDisabled();
    expect(screen.getByLabelText(akMT('increase'))).toBeDisabled();

    expect(
      screen.getByText(akMT('serviceAccountModule.doesNotExpireHelperText'))
    ).toBeInTheDocument();
  });
});

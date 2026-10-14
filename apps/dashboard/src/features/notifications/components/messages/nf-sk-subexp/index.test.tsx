import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { textForRichTextMessage } from '@irene/translations/test-utils';

import { formatExpiryDate } from '@/features/notifications/utils';
import { buildNfSkSubexpContext } from '@tests/factories';
import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NfSkSubexp } from './index';

const context = buildNfSkSubexpContext();

describe('NfSkSubexp', () => {
  it('renders the subscription message in full', () => {
    const subscription = buildNfSkSubexpContext({ is_trial: false });

    renderWithRouterContext(<NfSkSubexp context={subscription} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-sk-subexp', {
          sub_expiry_date: formatExpiryDate(subscription.subscription_end_date),
        })
      )
    );
  });

  it('renders the trial message in full when the subscription is a trial', () => {
    const trial = buildNfSkSubexpContext({ is_trial: true });

    renderWithRouterContext(<NfSkSubexp context={trial} />);

    expect(element('message-body')).toHaveTextContent(
      textForRichTextMessage(
        akMT('notificationModule.messages.nf-sk-subexp-trial', {
          sub_expiry_date: formatExpiryDate(trial.subscription_end_date),
        })
      )
    );
  });

  it('writes the expiry date out rather than passing the timestamp through', () => {
    renderWithRouterContext(<NfSkSubexp context={context} />);

    expect(element('message-body')).not.toHaveTextContent(context.subscription_end_date);
  });
});

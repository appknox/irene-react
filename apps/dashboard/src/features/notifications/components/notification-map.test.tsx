import { screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';

import { organizationStore } from '@irene/api/stores/organization';

import {
  buildNfNsrejctd1Context,
  buildNfSkSubexpContext,
  buildNfStrUrlUpldfailnprjdeny2Context,
  buildOrganization,
  buildOrganizationMe,
  NOTIFICATION_CONTEXT_BUILDERS,
} from '@tests/factories';

import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NOTIFICATION_MAP, type NotificationCode } from './notification-map';

const codes = Object.keys(NOTIFICATION_MAP) as NotificationCode[];

/** What the error message renders, which stands in for a notification this build cannot show. */
const UNRENDERED = 'No message object registered for messageCode';

describe('NOTIFICATION_MAP', () => {
  beforeEach(() => {
    organizationStore.getState().select(buildOrganization(), buildOrganizationMe());
  });

  it('registers a message for every code the API sends', () => {
    expect(codes).toHaveLength(44);
  });

  it('pairs every registered code with a context builder', () => {
    expect(Object.keys(NOTIFICATION_CONTEXT_BUILDERS).sort()).toEqual([...codes].sort());
  });

  it.each(codes)('renders %s from the context that notification carries', (code) => {
    renderWithRouterContext(NOTIFICATION_MAP[code](NOTIFICATION_CONTEXT_BUILDERS[code](), code));

    expect(element('message-body')).toBeInTheDocument();
    expect(element('message-body')).not.toHaveTextContent(UNRENDERED);
  });

  it('renders the trial wording when a subscription expiry says it is a trial', () => {
    const trial = buildNfSkSubexpContext({ is_trial: true });

    renderWithRouterContext(NOTIFICATION_MAP.NF_SK_SUBEXP(trial, 'NF_SK_SUBEXP'));

    expect(screen.getByText(/trial subscription/)).toBeInTheDocument();
  });

  it('renders the subscription wording when the expiry is not a trial', () => {
    const subscription = buildNfSkSubexpContext({ is_trial: false });

    renderWithRouterContext(NOTIFICATION_MAP.NF_SK_SUBEXP(subscription, 'NF_SK_SUBEXP'));

    expect(screen.queryByText(/trial subscription/)).not.toBeInTheDocument();
  });

  it('leaves out the store link when a project denial carries no store listing', () => {
    const withoutStore = buildNfStrUrlUpldfailnprjdeny2Context({ store_url: '' });

    renderWithRouterContext(
      NOTIFICATION_MAP.NF_STR_URL_UPLDFAILNPRJDENY2(withoutStore, 'NF_STR_URL_UPLDFAILNPRJDENY2')
    );

    expect(screen.queryByTestId('notification-store-link')).not.toBeInTheDocument();
  });

  it('states the code when a context carries a value of the wrong type', () => {
    const context = { ...buildNfNsrejctd1Context(), namespace_value: 7 };

    renderWithRouterContext(NOTIFICATION_MAP.NF_NSREJCTD1(context, 'NF_NSREJCTD1'));

    expect(element('message-body')).toHaveTextContent('NF_NSREJCTD1');
    expect(screen.queryByText(/namespace request/)).not.toBeInTheDocument();
  });

  it('states the code when a context is missing a value its message renders', () => {
    const context: Record<string, unknown> = buildNfNsrejctd1Context();

    delete context.namespace_value;

    renderWithRouterContext(NOTIFICATION_MAP.NF_NSREJCTD1(context, 'NF_NSREJCTD1'));

    expect(element('message-body')).toHaveTextContent('NF_NSREJCTD1');
  });

  it('renders the message when the context carries only what that notification sends', () => {
    const context = buildNfNsrejctd1Context();

    renderWithRouterContext(NOTIFICATION_MAP.NF_NSREJCTD1(context, 'NF_NSREJCTD1'));

    expect(element('message-body')).not.toHaveTextContent(UNRENDERED);
    expect(screen.getByText(/namespace request/)).toBeInTheDocument();
  });

  it('ignores a field the notification carries that its message never reads', () => {
    const context = { ...buildNfNsrejctd1Context(), a_field_no_message_reads: 'ignored' };

    renderWithRouterContext(NOTIFICATION_MAP.NF_NSREJCTD1(context, 'NF_NSREJCTD1'));

    expect(element('message-body')).not.toHaveTextContent(UNRENDERED);
    expect(element('message-body')).not.toHaveTextContent('ignored');
  });
});

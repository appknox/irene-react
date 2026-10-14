import { describe, expect, it } from 'vitest';

import { notificationElement as element } from '@tests/notification';
import { renderWithRouterContext } from '@tests/render';

import { NotificationErrorMessage } from './error';

describe('NotificationErrorMessage', () => {
  it('states that the code has no message, and names the code', () => {
    renderWithRouterContext(<NotificationErrorMessage messageCode="NF_NOT_A_CODE" />);

    expect(element('message-body')).toHaveTextContent(
      'No message object registered for messageCode: NF_NOT_A_CODE'
    );
  });

  it('marks itself as a message body, so the list treats it as one', () => {
    renderWithRouterContext(<NotificationErrorMessage messageCode="NF_NOT_A_CODE" />);

    expect(element('message-body')).toBeInTheDocument();
  });
});

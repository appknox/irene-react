import { AkTypography } from '@irene/ui/ak-typography';

/**
 * Stands in for a notification this build cannot render: one whose code it has no
 * message for, or whose context does not match the shape that message needs.
 * States the code so the notification can still be traced back to what sent it.
 *
 * @param props.messageCode - The code the API sent.
 */
export function NotificationErrorMessage({ messageCode }: Readonly<{ messageCode: string }>) {
  return (
    <AkTypography data-test-notification-message-body>
      {`No message object registered for messageCode: ${messageCode}`}
    </AkTypography>
  );
}

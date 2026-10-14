import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';

/**
 * Whether a registered device is online.
 *
 * @param props.isConnected - Whether the device farm reports it connected.
 */
export function DeviceStatus({ isConnected }: Readonly<{ isConnected: boolean }>) {
  return (
    <AkChip
      variant="semi-filled"
      size="small"
      fontWeight="medium"
      color={isConnected ? 'success' : 'secondary'}
      label={
        isConnected
          ? akMT('cyod.deviceRegistration.online')
          : akMT('cyod.deviceRegistration.offline')
      }
      data-test-cyod-device-status
    />
  );
}

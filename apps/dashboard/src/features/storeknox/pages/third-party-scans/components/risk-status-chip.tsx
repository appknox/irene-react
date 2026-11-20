import { ENUMS } from '@irene/enums';
import { akMT } from '@irene/translations/intl';
import { AkChip } from '@irene/ui/ak-chip';
import { AkIcon } from '@irene/ui/ak-icon';

interface RiskStatusChipProps {
  status: number;
}

/* The chip's wording and colour for a risk status; a code the enum does not name reads as unknown. */
const _riskChip = (status: number) => {
  switch (status) {
    case ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.MINIMAL:
      return { label: akMT('storeknox.riskStatus.minimal'), color: 'success' } as const;
    case ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.MEDIUM:
      return { label: akMT('storeknox.riskStatus.medium'), color: 'warn' } as const;
    case ENUMS.SK_THIRD_PARTY_APP_RISK_STATUS.HIGH:
      return { label: akMT('storeknox.riskStatus.high'), color: 'error' } as const;
    default:
      return { label: akMT('storeknox.riskStatus.unknown'), color: 'default' } as const;
  }
};

/**
 * An app's risk status as a coloured chip with a security icon: minimal is green, medium amber,
 * high red, and anything else is neutral and reads "Unknown".
 *
 * @param props.status - The `risk_status` code the server sent.
 */
export function RiskStatusChip({ status }: Readonly<RiskStatusChipProps>) {
  const { label, color } = _riskChip(status);

  return (
    <AkChip
      variant="semi-filled"
      color={color}
      label={label}
      icon={<AkIcon name="material-symbols:security" />}
      data-test-sk-risk-status-chip
    />
  );
}

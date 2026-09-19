import { Link } from '@tanstack/react-router';
import { getConfigValue } from '@irene/config';

const DEFAULT_LOGO = '/images/logo.png';
const DEFAULT_NAME = 'Appknox';

/**
 * The product logo, swapped per deployment by the whitelabel config.
 *
 * @param props.className - Sizing for the image.
 */
export function AppLogo({ className }: Readonly<{ className?: string }>) {
  const name = getConfigValue('WHITELABEL_NAME') || DEFAULT_NAME;

  return (
    <Link to="/" aria-label={name}>
      <img
        src={getConfigValue('WHITELABEL_LOGO') || DEFAULT_LOGO}
        alt={name}
        className={className}
      />
    </Link>
  );
}

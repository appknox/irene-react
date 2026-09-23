import { Link } from '@tanstack/react-router';

import { AkSkeleton } from '@irene/ui/ak-skeleton';
import { useWhitelabel } from '@/hooks/use-whitelabel';

/**
 * The product logo, as this deployment brands itself.
 *
 * @param props.className - Sizing for the image.
 */
export function AppLogo({ className }: Readonly<{ className?: string }>) {
  const { hasLoadedFrontendConfig, name, logo } = useWhitelabel();

  // Show the logo when the frontend configuration has loaded
  if (hasLoadedFrontendConfig) {
    return (
      <Link to="/" aria-label={name}>
        <img src={logo} alt={name} className={className} />
      </Link>
    );
  }

  // Stands in at the logo's own size, so the card does not jump when it arrives.
  return <AkSkeleton height="40px" className="w-full max-w-42.5" data-test-app-logo-pending />;
}

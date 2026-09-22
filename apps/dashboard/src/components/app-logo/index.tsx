import { Link } from '@tanstack/react-router';
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

  // Holds the logo's height, so the card does not jump when it arrives.
  return <div className="h-10" data-test-app-logo-pending />;
}

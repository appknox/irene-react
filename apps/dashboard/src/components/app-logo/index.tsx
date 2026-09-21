import { Link } from '@tanstack/react-router';
import { useWhitelabel } from '@/hooks/use-whitelabel';

/**
 * The product logo, as this deployment brands itself.
 *
 * @param props.className - Sizing for the image.
 */
export function AppLogo({ className }: Readonly<{ className?: string }>) {
  const { name, logo } = useWhitelabel();

  return (
    <Link to="/" aria-label={name}>
      <img src={logo} alt={name} className={className} />
    </Link>
  );
}

import { useEffect } from 'react';
import { useWhitelabel } from '@/hooks/use-whitelabel';

/**
 * Puts the deployment's colour scheme on the document body.
 *
 * The body is outside React's tree, so this is the one piece of branding that
 * has to be assigned rather than rendered. Ported stylesheets select on it.
 */
export function useThemeClass(): void {
  const { theme } = useWhitelabel();

  useEffect(() => {
    const className = `theme-${theme}`;
    document.body.classList.add(className);

    return () => document.body.classList.remove(className);
  }, [theme]);
}

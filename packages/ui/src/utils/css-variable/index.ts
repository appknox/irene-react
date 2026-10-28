/**
 * Reads what a CSS variable resolves to.
 *
 * A canvas cannot resolve `var(--color-x)` itself, so it is read here first.
 *
 * @param name - The variable, such as `--color-primary`.
 * @param fallback - What to answer where the document holds no value for it.
 * @returns The value the variable holds.
 */
export function getCSSVariableValue(name: string, fallback = '#000000') {
  if (typeof window === 'undefined') {
    return fallback;
  }

  return (
    window.getComputedStyle(document.documentElement).getPropertyValue(name).trim() || fallback
  );
}

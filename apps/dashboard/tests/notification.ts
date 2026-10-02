/**
 * Finds a part of a rendered notification by the marker its component carries.
 *
 * Notification messages are marked with `data-test-notification-*` attributes
 * rather than a `data-testid`, so they are read by attribute.
 *
 * @param part - The marker's suffix, e.g. `message-body` or `risk-counts`.
 * @returns The element, which the caller asserts on.
 */
export function notificationElement(part: string): HTMLElement {
  const element = document.querySelector<HTMLElement>(`[data-test-notification-${part}]`);

  if (!element) {
    throw new Error(`No notification element marked data-test-notification-${part}`);
  }

  return element;
}

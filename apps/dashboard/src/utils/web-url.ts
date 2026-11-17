/**
 * Whether a link the server handed back is a web address, and so safe to send
 * the browser to. A `javascript:` or `data:` link never is.
 *
 * Billing's payment and invoice links and reporting's download links both go
 * through this before the browser follows them.
 *
 * @param url - The link.
 * @returns Whether it is http or https.
 */
export function isWebUrl(url: string) {
  try {
    return ['http:', 'https:'].includes(new URL(url).protocol);
  } catch {
    return false;
  }
}

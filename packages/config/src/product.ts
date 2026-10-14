/**
 * The release number of each Appknox product, displayed to the user.
 *
 * The dashboard's side navigation shows `appknox` in its "Version - 26.9.2"
 * row; StoreKnox's navigation shows `storeknox`. Support asks for this number
 * to identify which release a report came from.
 *
 * These are product release numbers, not the version of this repository or
 * anything the API returns. Bump them here as part of the release.
 */
export const PRODUCT_VERSIONS = {
  appknox: '26.9.2',
  storeknox: '26.9',
} as const;

/**
 * The Pendo agent this product is registered as.
 *
 * Public by design: it identifies the application to Pendo's CDN and ships in
 * every bundle, so it is not a secret. A deployment that runs its own Pendo
 * subscription supplies its key through `integrations.pendo_key` on the
 * frontend configuration, which the installer prefers over this one.
 */
export const PENDO_API_KEY = 'f0a11665-8469-4c41-419f-b9f400b01f08';

/**
 * The reCAPTCHA site this product verifies registrations against.
 *
 * Public by design: Google requires the site key in the page, and it is tied
 * to the domains registered for it rather than kept secret. The secret half
 * lives in mycroft, which verifies the token the widget returns.
 */
export const G_RECAPTCHA = {
  siteKey: '6LffPdIaAAAAANWL4gm7J6j9EJzKSuYEDAQ0Ry2x',
  jsUrl: 'https://recaptcha.net/recaptcha/api.js?render=explicit',
} as const;

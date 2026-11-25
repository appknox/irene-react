/** How long a new account's token lasts unless it is changed, as irene opens the field. */
export const DEFAULT_EXPIRY_IN_DAYS = 30;

/**
 * The moment a token taken out today would expire.
 *
 * @param days - How many days it lasts.
 * @returns That moment, as the API takes it.
 */
export function expiryDateIn(days: number) {
  const expiry = new Date();

  expiry.setDate(expiry.getDate() + days);

  return expiry;
}

/**
 * The account as Freshdesk is told about it.
 *
 * @interface ApiFreshdeskAuthentication
 * @property {string} token - A JWT naming the account, which expires after two hours.
 * @property {string} name - The account's username, as the widget shows it.
 * @property {string} email - The address the widget replies to.
 */
export interface ApiFreshdeskAuthentication {
  token: string;
  name: string;
  email: string;
}

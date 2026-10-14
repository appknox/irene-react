import dayjs from 'dayjs';
import { z } from 'zod';

import { akMT } from '@irene/translations/intl';

/**
 * States a date in full, as a notification names when something was requested.
 *
 * @param value - The date, as the API sends it.
 * @returns The date written out, or an empty string for one it cannot read.
 */
export function formatNotificationDate(value: string): string {
  const date = dayjs(value);

  return date.isValid() ? date.format('D MMMM YYYY') : '';
}

/**
 * States a date shortened, as a subscription names when it expires.
 *
 * @param value - The date, as the API sends it.
 * @returns The date, or an empty string for one it cannot read.
 */
export function formatExpiryDate(value: string): string {
  const date = dayjs(value);

  return date.isValid() ? date.format('MMM D, YYYY') : '';
}

/**
 * Strips the registry from an SBOM component's name.
 *
 * The API sends the name qualified by its registry, such as `npm::lodash`, and
 * the half after the separator is the name a reader recognises. A notification
 * that carries the plain name separately is taken at its word instead.
 *
 * @param name - The plain name, where the notification carries one.
 * @param qualifiedName - The name qualified by its registry.
 * @returns The name without its registry.
 */
export function sbomComponentNameWithoutRegistry(name: string, qualifiedName: string): string {
  if (name) {
    return name;
  }

  return qualifiedName.split('::')[1] || qualifiedName;
}

/**
 * Names the store an app was taken from, for a message that reads "… from {store_name}".
 *
 * @param storeUrl - The listing the notification carries.
 * @returns The store's name, or the generic word for a host neither store serves.
 */
export function storeNameForUrl(storeUrl: string): string {
  try {
    const { hostname } = new URL(storeUrl);

    if (hostname === 'play.google.com') {
      return akMT('googlePlayStore');
    }

    if (hostname === 'apps.apple.com') {
      return akMT('appleAppStore');
    }
  } catch {
    /* A listing the server sent that is not a URL still names a store generically. */
  }

  return akMT('storeLowercase');
}

/**
 * An identifier or version code, which the API sends as a number.
 *
 * Accepted as a string too: a notification's context is stored as it was built,
 * so rows written by an earlier backend keep whatever that version sent, and a
 * message that only shows the value or puts it in a route path reads either.
 */
export const notificationScalarSchema = z.union([z.number(), z.string()]);

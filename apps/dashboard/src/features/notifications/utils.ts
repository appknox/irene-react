import { akMT } from '@irene/translations/intl';

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

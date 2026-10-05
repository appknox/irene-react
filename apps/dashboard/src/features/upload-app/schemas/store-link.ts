import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { createAkFormField } from '@irene/ui/ak-form/helpers';

/** The stores an app can be fetched from, by the host that serves them. */
const PLAY_STORE_HOST = 'play.google.com';
const APP_STORE_HOST = 'apps.apple.com';

/** What a Play Store listing's path and query look like. */
const PLAY_STORE_LISTING_PATH = /\/store\/apps\/details/;
const PLAY_STORE_PACKAGE_NAME = /[?&]id=([^&]+)/;

/** What an App Store listing's path looks like: a country, a name, and an id. */
const APP_STORE_LISTING_PATH = /^\/[a-z]{2}\/app\/[^/]+\/id\d+$/;

/** The link read as a URL, or nothing when it is not one. */
function _readUrl(link: string) {
  try {
    return new URL(link);
  } catch {
    return undefined;
  }
}

/** Whether a Play Store link names the app to fetch. */
function _validatePlayStoreLink(url: URL) {
  return PLAY_STORE_LISTING_PATH.test(url.pathname) && PLAY_STORE_PACKAGE_NAME.test(url.search);
}

/** What is wrong with a store link, if anything. */
function _validateStoreLink(link: string) {
  if (link === '') {
    return akMT('uploadAppModule.blankStoreLink');
  }

  const url = _readUrl(link);

  if (url?.hostname === PLAY_STORE_HOST) {
    return _validatePlayStoreLink(url) ? undefined : akMT('uploadAppModule.invalidPlayStoreLink');
  }

  if (url?.hostname === APP_STORE_HOST) {
    return APP_STORE_LISTING_PATH.test(url.pathname)
      ? undefined
      : akMT('uploadAppModule.invalidAppStoreLink');
  }

  return akMT('uploadAppModule.unsupportedStoreLink');
}

/** What is wrong with a link that only has to be a URL, if anything. */
function _validateAnyLink(link: string) {
  if (link === '') {
    return akMT('uploadAppModule.blankLink');
  }

  return _readUrl(link) ? undefined : akMT('uploadAppModule.invalidLink');
}

/**
 * The link to fetch an app from. Built per render, so its messages follow the
 * active locale.
 *
 * A store link has to name a store this client knows and then an app within
 * it, because the server fetches the app from the listing it points at. An
 * offensive-security run takes the app from wherever the link leads, so there
 * only has to be a URL there.
 *
 * @param isOffsec - Whether the link is for an offensive-security run.
 * @returns The schema.
 */
export const buildStoreLinkSchema = (isOffsec?: boolean) =>
  z.object({
    url: z
      .string()
      .trim()
      .superRefine((link, context) => {
        const problem = isOffsec ? _validateAnyLink(link) : _validateStoreLink(link);

        if (problem) {
          context.addIssue({ code: 'custom', message: problem });
        }
      }),
  });

export type StoreLinkFormSchema = z.infer<ReturnType<typeof buildStoreLinkSchema>>;

/**
 * The field this form's controls are built from, bound to the schema above so
 * every `name` is checked against it.
 */
export const StoreLinkFormField = createAkFormField<StoreLinkFormSchema>();

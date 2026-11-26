import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { createAkFormField } from '@irene/ui/ak-form/helpers';

/** What setting up an OpenID Connect provider needs, which irene asks for in full. */
export const buildOidcProviderSchema = () =>
  z.object({
    client_id: z
      .string()
      .trim()
      .min(1, { message: akMT('pleaseEnterAllDetails') }),

    client_secret: z
      .string()
      .trim()
      .min(1, { message: akMT('pleaseEnterAllDetails') }),

    discovery_url: z
      .string()
      .trim()
      .min(1, { message: akMT('pleaseEnterAllDetails') })
      .url({ message: akMT('enterValidURL') }),
  });

export type OidcProviderFormSchema = z.infer<ReturnType<typeof buildOidcProviderSchema>>;

export const OidcProviderFormField = createAkFormField<OidcProviderFormSchema>();

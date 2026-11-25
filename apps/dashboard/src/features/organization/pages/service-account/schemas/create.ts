import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { createAkFormField } from '@irene/ui/ak-form/helpers';

/** What a service account must say about itself: irene asks for both, and nothing else. */
export const buildServiceAccountSchema = () =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, { message: akMT('pleaseEnterAllDetails') }),
    description: z
      .string()
      .trim()
      .min(1, { message: akMT('pleaseEnterAllDetails') }),
  });

export type ServiceAccountFormSchema = z.infer<ReturnType<typeof buildServiceAccountSchema>>;

export const ServiceAccountFormField = createAkFormField<ServiceAccountFormSchema>();

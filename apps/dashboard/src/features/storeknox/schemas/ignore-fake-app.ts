import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { createAkFormField } from '@irene/ui/ak-form/helpers';

/** The reason a reviewer gives for ignoring a copy; spaces alone are not a reason. */
export const ignoreFakeAppSchema = z.object({
  reason: z.string().trim().min(1, akMT('storeknox.ignoreReasonRequired')),
});

export type IgnoreFakeAppSchema = z.infer<typeof ignoreFakeAppSchema>;

/** The field this form's controls are built from, bound to the schema above. */
export const IgnoreFakeAppField = createAkFormField<IgnoreFakeAppSchema>();

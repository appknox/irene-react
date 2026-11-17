import { z } from 'zod';

import { akMT } from '@irene/translations/intl';
import { createAkFormField } from '@irene/ui/ak-form/helpers';

/** The longest name Luna keeps for a saved report. */
export const REPORT_NAME_MAX_LENGTH = 80;

/**
 * A saved report's name. Luna trims it and refuses an empty or overlong one,
 * so the same checks run here before the round trip. Built per render, so its
 * messages follow the active locale.
 *
 * @returns The schema.
 */
export const buildReportNameSchema = () =>
  z.object({
    name: z
      .string()
      .trim()
      .min(1, akMT('reportModule.savedReports.nameRequired'))
      .max(
        REPORT_NAME_MAX_LENGTH,
        akMT('reportModule.savedReports.nameTooLong', { max: REPORT_NAME_MAX_LENGTH })
      ),
  });

export type ReportNameFormSchema = z.infer<ReturnType<typeof buildReportNameSchema>>;

/** The field the rename form's control is built from, bound to the schema above. */
export const ReportNameFormField = createAkFormField<ReportNameFormSchema>();

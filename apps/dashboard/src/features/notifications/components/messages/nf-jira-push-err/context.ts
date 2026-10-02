import { z } from 'zod';

/*
  The context `nf-jira-push-err` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfJiraPushErrContextSchema = z.object({
  file_id: z.number(),
  package_name: z.string(),
  error_message: z.string(),
});

export type NfJiraPushErrContext = z.infer<typeof nfJiraPushErrContextSchema>;

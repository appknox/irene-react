import { z } from 'zod';

/*
  The context `nf-automated-dast-completed` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfAutomatedDastCompletedContextSchema = z.object({
  file_id: z.number(),
  platform: z.string(),
  package_name: z.string(),
});

export type NfAutomatedDastCompletedContext = z.infer<typeof nfAutomatedDastCompletedContextSchema>;

import { z } from 'zod';

/*
  The context `nf-upldfailpayrq1` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfUpldfailpayrq1ContextSchema = z.object({
  package_name: z.string(),
});

export type NfUpldfailpayrq1Context = z.infer<typeof nfUpldfailpayrq1ContextSchema>;

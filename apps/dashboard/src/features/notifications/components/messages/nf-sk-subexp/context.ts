import { z } from 'zod';

/*
  The context `nf-sk-subexp` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfSkSubexpContextSchema = z.object({
  organization_name: z.string().optional(),
  weeks_remaining: z.number().optional(),
  subscription_end_date: z.string(),
  is_trial: z.boolean(),
});

export type NfSkSubexpContext = z.infer<typeof nfSkSubexpContextSchema>;

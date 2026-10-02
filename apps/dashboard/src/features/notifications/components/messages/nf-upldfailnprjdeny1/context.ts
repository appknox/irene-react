import { z } from 'zod';

/*
  The context `nf-upldfailnprjdeny1` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfUpldfailnprjdeny1ContextSchema = z.object({
  package_name: z.string(),
  platform: z.number().optional(),
  platform_display: z.string(),
});

export type NfUpldfailnprjdeny1Context = z.infer<typeof nfUpldfailnprjdeny1ContextSchema>;

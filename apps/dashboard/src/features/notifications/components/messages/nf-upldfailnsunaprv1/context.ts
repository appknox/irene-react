import { z } from 'zod';

/*
  The context `nf-upldfailnsunaprv1` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfUpldfailnsunaprv1ContextSchema = z.object({
  namespace_value: z.string(),
  platform: z.number().optional(),
  platform_display: z.string(),
});

export type NfUpldfailnsunaprv1Context = z.infer<typeof nfUpldfailnsunaprv1ContextSchema>;

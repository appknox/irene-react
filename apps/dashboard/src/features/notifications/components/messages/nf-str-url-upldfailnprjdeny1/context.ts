import { z } from 'zod';

/*
  The context `nf-str-url-upldfailnprjdeny1` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfStrUrlUpldfailnprjdeny1ContextSchema = z.object({
  store_url: z.string(),
  error_message: z.string().optional(),
  package_name: z.string(),
  platform: z.number().optional(),
  platform_display: z.string().optional(),
});

export type NfStrUrlUpldfailnprjdeny1Context = z.infer<
  typeof nfStrUrlUpldfailnprjdeny1ContextSchema
>;

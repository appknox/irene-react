import { z } from 'zod';

/*
  The context `nf-str-url-vldtn-err` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfStrUrlVldtnErrContextSchema = z.object({
  store_url: z.string(),
  error_message: z.string(),
});

export type NfStrUrlVldtnErrContext = z.infer<typeof nfStrUrlVldtnErrContextSchema>;

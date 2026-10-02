import { z } from 'zod';

/*
  The context `nf-public-api-user-updated` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfPublicApiUserUpdatedContextSchema = z.object({
  type: z.string(),
  user_email: z.string(),
  current: z.string(),
  updated: z.string(),
  changed_by: z.string(),
});

export type NfPublicApiUserUpdatedContext = z.infer<typeof nfPublicApiUserUpdatedContextSchema>;

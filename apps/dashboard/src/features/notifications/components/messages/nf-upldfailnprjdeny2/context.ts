import { z } from 'zod';

/*
  The context `nf-upldfailnprjdeny2` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfUpldfailnprjdeny2ContextSchema = z.object({
  package_name: z.string(),
  project_id: z.number(),
  platform: z.number().optional(),
  platform_display: z.string(),
  requester_username: z.string(),
  requester_role: z.string(),
});

export type NfUpldfailnprjdeny2Context = z.infer<typeof nfUpldfailnprjdeny2ContextSchema>;

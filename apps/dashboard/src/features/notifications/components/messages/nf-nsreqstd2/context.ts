import { z } from 'zod';

/*
  The context `nf-nsreqstd2` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfNsreqstd2ContextSchema = z.object({
  namespace_id: z.number(),
  namespace_created_on: z.string(),
  namespace_value: z.string(),
  platform: z.number().optional(),
  platform_display: z.string(),
  initial_requester_username: z.string(),
  current_requester_username: z.string(),
  store_url: z.string().optional(),
});

export type NfNsreqstd2Context = z.infer<typeof nfNsreqstd2ContextSchema>;

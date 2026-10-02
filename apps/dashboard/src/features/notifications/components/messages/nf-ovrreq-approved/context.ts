import { z } from 'zod';

/*
  The context `nf-ovrreq-approved` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfOvrreqApprovedContextSchema = z.object({
  file_id: z.number(),
  analysis_id: z.number(),
  vulnerability_id: z.number().optional(),
  requester_username: z.string().optional(),
  requester_email: z.string().nullable(),
  override_request_uuid: z.string().optional(),
  reviewer_username: z.string().optional(),
  reviewer_email: z.string().nullable(),
});

export type NfOvrreqApprovedContext = z.infer<typeof nfOvrreqApprovedContextSchema>;

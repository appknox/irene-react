import { z } from 'zod';

/*
  The context `nf-apistcmpltd1` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfApistcmpltd1ContextSchema = z.object({
  package_name: z.string(),
  platform: z.number(),
  platform_display: z.string(),
  file_id: z.number(),
  file_name: z.string(),
  version: z.string(),
  version_code: z.string(),
  critical_count: z.number(),
  high_count: z.number(),
  medium_count: z.number(),
  low_count: z.number(),
  passed_count: z.number(),
  untested_count: z.number(),
  risk_count: z.number().optional(),
});

export type NfApistcmpltd1Context = z.infer<typeof nfApistcmpltd1ContextSchema>;

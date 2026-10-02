import { z } from 'zod';

/*
  The context `nf-sbomcmpltd` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfSbomcmpltdContextSchema = z.object({
  package_name: z.string(),
  platform: z.number().optional(),
  platform_display: z.string(),
  file_id: z.number(),
  file_name: z.string(),
  version: z.string(),
  version_code: z.string(),
  sb_project_id: z.number(),
  sb_file_id: z.number(),
  components_with_updates_count: z.number(),
  vulnerable_components_count: z.number(),
  components_count: z.number(),
});

export type NfSbomcmpltdContext = z.infer<typeof nfSbomcmpltdContextSchema>;

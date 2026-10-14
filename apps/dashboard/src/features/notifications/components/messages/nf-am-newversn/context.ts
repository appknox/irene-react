import { z } from 'zod';

/*
  The context `nf-am-newversn` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfAmNewversnContextSchema = z.object({
  package_name: z.string(),
  app_name: z.string(),
  am_app_version_id: z.number().optional(),
  am_app_id: z.number(),
  project_id: z.number().optional(),
  platform: z.number().optional(),
  platform_display: z.string(),
  version_unscanned: z.string(),
  version_scanned: z.string().nullable().optional(),
});

export type NfAmNewversnContext = z.infer<typeof nfAmNewversnContextSchema>;

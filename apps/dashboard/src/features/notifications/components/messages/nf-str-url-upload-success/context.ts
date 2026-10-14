import { z } from 'zod';

/*
  The context `nf-str-url-upload-success` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfStrUrlUploadSuccessContextSchema = z.object({
  package_name: z.string(),
  platform: z.number().optional(),
  platform_display: z.string(),
  file_id: z.number(),
  version: z.string(),
  version_code: z.string(),
  store_url: z.string(),
});

export type NfStrUrlUploadSuccessContext = z.infer<typeof nfStrUrlUploadSuccessContextSchema>;

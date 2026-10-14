import { z } from 'zod';

/*
  The context `nf-sbom-vuln-update` carries, as the API sends it, checked at the map
  before the message renders.

  A field the message renders is required: without it the message would show a
  hole, so the notification renders as its code instead. A field the API sends
  but this message does not read is optional, and so is one the message guards
  itself or the API only sometimes sends.
*/
export const nfSbomVulnUpdateContextSchema = z.object({
  component_name: z.string(),
  ghsa_ids: z.array(z.string()).optional(),
  max_severity: z.string().nullable(),
  fixed_version: z.string(),
  affected_apps_count: z.number().optional(),
  name: z.string(),
  advisory_urls: z.array(z.string()).optional(),
  namespace: z.string().optional(),
  purl_type: z.string().optional(),
  registry_url: z.string().optional(),
});

export type NfSbomVulnUpdateContext = z.infer<typeof nfSbomVulnUpdateContextSchema>;

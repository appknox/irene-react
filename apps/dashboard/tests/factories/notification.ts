import { faker } from '@faker-js/faker';

import type { ApiNotification } from '@irene/api/services/notification';

import type { NfAmNewversnContext } from '@/features/notifications/components/messages/nf-am-newversn/context';
import type { NfApistcmpltd1Context } from '@/features/notifications/components/messages/nf-apistcmpltd1/context';
import type { NfAutomatedDastCompletedContext } from '@/features/notifications/components/messages/nf-automated-dast-completed/context';
import type { NfAutomatedDastErroredContext } from '@/features/notifications/components/messages/nf-automated-dast-errored/context';
import type { NfAutomatedDastInProgressContext } from '@/features/notifications/components/messages/nf-automated-dast-in-progress/context';
import type { NfAutomatedDastPartiallyCompletedContext } from '@/features/notifications/components/messages/nf-automated-dast-partially-completed/context';
import type { NfDastcmpltd1Context } from '@/features/notifications/components/messages/nf-dastcmpltd1/context';
import type { NfJiraPushErrContext } from '@/features/notifications/components/messages/nf-jira-push-err/context';
import type { NfNsapprvd1Context } from '@/features/notifications/components/messages/nf-nsapprvd1/context';
import type { NfNsapprvd2Context } from '@/features/notifications/components/messages/nf-nsapprvd2/context';
import type { NfNsautoapprvd1Context } from '@/features/notifications/components/messages/nf-nsautoapprvd1/context';
import type { NfNsautoapprvd2Context } from '@/features/notifications/components/messages/nf-nsautoapprvd2/context';
import type { NfNsrejctd1Context } from '@/features/notifications/components/messages/nf-nsrejctd1/context';
import type { NfNsrejctd2Context } from '@/features/notifications/components/messages/nf-nsrejctd2/context';
import type { NfNsreqstd1Context } from '@/features/notifications/components/messages/nf-nsreqstd1/context';
import type { NfNsreqstd2Context } from '@/features/notifications/components/messages/nf-nsreqstd2/context';
import type { NfOvrreqApprovedReqstrContext } from '@/features/notifications/components/messages/nf-ovrreq-approved-reqstr/context';
import type { NfOvrreqApprovedContext } from '@/features/notifications/components/messages/nf-ovrreq-approved/context';
import type { NfOvrreqRaisedContext } from '@/features/notifications/components/messages/nf-ovrreq-raised/context';
import type { NfOvrreqRejectedContext } from '@/features/notifications/components/messages/nf-ovrreq-rejected/context';
import type { NfPublicApiUserUpdatedContext } from '@/features/notifications/components/messages/nf-public-api-user-updated/context';
import type { NfSastcmpltd1Context } from '@/features/notifications/components/messages/nf-sastcmpltd1/context';
import type { NfSbomCompUpdateContext } from '@/features/notifications/components/messages/nf-sbom-comp-update/context';
import type { NfSbomVulnUpdateContext } from '@/features/notifications/components/messages/nf-sbom-vuln-update/context';
import type { NfSbomcmpltdContext } from '@/features/notifications/components/messages/nf-sbomcmpltd/context';
import type { NfSkNewversnContext } from '@/features/notifications/components/messages/nf-sk-newversn/context';
import type { NfSkSubexpContext } from '@/features/notifications/components/messages/nf-sk-subexp/context';
import type { NfStrUrlNsreqstd1Context } from '@/features/notifications/components/messages/nf-str-url-nsreqstd1/context';
import type { NfStrUrlNsreqstd2Context } from '@/features/notifications/components/messages/nf-str-url-nsreqstd2/context';
import type { NfStrUrlUpldfailnprjdeny1Context } from '@/features/notifications/components/messages/nf-str-url-upldfailnprjdeny1/context';
import type { NfStrUrlUpldfailnprjdeny2Context } from '@/features/notifications/components/messages/nf-str-url-upldfailnprjdeny2/context';
import type { NfStrUrlUpldfailnscreatd1Context } from '@/features/notifications/components/messages/nf-str-url-upldfailnscreatd1/context';
import type { NfStrUrlUpldfailnsunaprv1Context } from '@/features/notifications/components/messages/nf-str-url-upldfailnsunaprv1/context';
import type { NfStrUrlUpldfailpay2Context } from '@/features/notifications/components/messages/nf-str-url-upldfailpay2/context';
import type { NfStrUrlUpldfailpayrq1Context } from '@/features/notifications/components/messages/nf-str-url-upldfailpayrq1/context';
import type { NfStrUrlUploadSuccessContext } from '@/features/notifications/components/messages/nf-str-url-upload-success/context';
import type { NfStrUrlVldtnErrContext } from '@/features/notifications/components/messages/nf-str-url-vldtn-err/context';
import type { NfSystmFileUploadSuccessContext } from '@/features/notifications/components/messages/nf-systm-file-upload-success/context';
import type { NfUpldfailnprjdeny1Context } from '@/features/notifications/components/messages/nf-upldfailnprjdeny1/context';
import type { NfUpldfailnprjdeny2Context } from '@/features/notifications/components/messages/nf-upldfailnprjdeny2/context';
import type { NfUpldfailnscreatd1Context } from '@/features/notifications/components/messages/nf-upldfailnscreatd1/context';
import type { NfUpldfailnsunaprv1Context } from '@/features/notifications/components/messages/nf-upldfailnsunaprv1/context';
import type { NfUpldfailpay2Context } from '@/features/notifications/components/messages/nf-upldfailpay2/context';
import type { NfUpldfailpayrq1Context } from '@/features/notifications/components/messages/nf-upldfailpayrq1/context';

const platformName = () => faker.helpers.arrayElement(['Android', 'iOS']);

const packageName = () => faker.internet.domainName().split('.').reverse().join('.');

const componentName = () => `npm::${faker.word.noun()}`;

const storeUrl = () => `https://play.google.com/store/apps/details?id=${packageName()}`;

const ghsaIds = () => [
  `GHSA-${faker.string.alphanumeric(4)}-${faker.string.alphanumeric(4)}-${faker.string.alphanumeric(4)}`,
];

const failedRoles = () => [
  { id: faker.number.int({ min: 1, max: 9 }), name: faker.person.jobTitle() },
];

/** One in-app notification, as the list returns it. */
export const buildNotification = (overrides: Partial<ApiNotification> = {}): ApiNotification => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  has_read: false,
  message_code: 'NF_SK_SUBEXP',
  context: buildNfSkSubexpContext(),
  created_on: faker.date.recent().toISOString(),
  ...overrides,
});

/** The context `nf-am-newversn` renders. */
export const buildNfAmNewversnContext = (
  overrides: Partial<NfAmNewversnContext> = {}
): NfAmNewversnContext => ({
  package_name: packageName(),
  app_name: faker.commerce.productName(),
  am_app_version_id: faker.number.int({ min: 1, max: 999 }),
  am_app_id: faker.number.int({ min: 1, max: 99999 }),
  project_id: faker.number.int({ min: 1, max: 999 }),
  platform: faker.number.int({ min: 0, max: 2 }),
  platform_display: platformName(),
  version_unscanned: faker.system.semver(),
  version_scanned: faker.system.semver(),
  ...overrides,
});

/** The context `nf-apistcmpltd1` renders. */
export const buildNfApistcmpltd1Context = (
  overrides: Partial<NfApistcmpltd1Context> = {}
): NfApistcmpltd1Context => ({
  package_name: packageName(),
  platform: faker.number.int({ min: 0, max: 2 }),
  platform_display: platformName(),
  file_id: faker.number.int({ min: 1, max: 99999 }),
  file_name: faker.commerce.productName(),
  version: faker.system.semver(),
  version_code: String(faker.number.int({ min: 1, max: 9999 })),
  critical_count: faker.number.int({ min: 1, max: 999 }),
  high_count: faker.number.int({ min: 1, max: 999 }),
  medium_count: faker.number.int({ min: 1, max: 999 }),
  low_count: faker.number.int({ min: 1, max: 999 }),
  passed_count: faker.number.int({ min: 1, max: 999 }),
  untested_count: faker.number.int({ min: 1, max: 999 }),
  ...overrides,
});

/** The context `nf-automated-dast-completed` renders. */
export const buildNfAutomatedDastCompletedContext = (
  overrides: Partial<NfAutomatedDastCompletedContext> = {}
): NfAutomatedDastCompletedContext => ({
  file_id: faker.number.int({ min: 1, max: 99999 }),
  platform: platformName(),
  package_name: packageName(),
  ...overrides,
});

/** The context `nf-automated-dast-errored` renders, which extends `nf-automated-dast-completed`. */
export const buildNfAutomatedDastErroredContext = (
  overrides: Partial<NfAutomatedDastErroredContext> = {}
): NfAutomatedDastErroredContext => ({
  ...buildNfAutomatedDastCompletedContext(),
  error_message: faker.lorem.sentence(),
  manual_dast_url: faker.internet.url(),
  ...overrides,
});

/** The context `nf-automated-dast-in-progress` renders, which matches `nf-automated-dast-completed`. */
export const buildNfAutomatedDastInProgressContext = (
  overrides: Partial<NfAutomatedDastInProgressContext> = {}
): NfAutomatedDastInProgressContext => ({
  ...buildNfAutomatedDastCompletedContext(),
  ...overrides,
});

/** The context `nf-automated-dast-partially-completed` renders, which extends `nf-automated-dast-completed`. */
export const buildNfAutomatedDastPartiallyCompletedContext = (
  overrides: Partial<NfAutomatedDastPartiallyCompletedContext> = {}
): NfAutomatedDastPartiallyCompletedContext => ({
  ...buildNfAutomatedDastCompletedContext(),
  failed_role_names: failedRoles(),
  manual_dast_url: faker.internet.url(),
  ...overrides,
});

/** The context `nf-dastcmpltd1` renders, which matches `nf-apistcmpltd1`. */
export const buildNfDastcmpltd1Context = (
  overrides: Partial<NfDastcmpltd1Context> = {}
): NfDastcmpltd1Context => ({
  ...buildNfApistcmpltd1Context(),
  ...overrides,
});

/** The context `nf-jira-push-err` renders. */
export const buildNfJiraPushErrContext = (
  overrides: Partial<NfJiraPushErrContext> = {}
): NfJiraPushErrContext => ({
  file_id: faker.number.int({ min: 1, max: 999 }),
  package_name: packageName(),
  error_message: faker.lorem.sentence(),
  ...overrides,
});

/** The context `nf-nsapprvd1` renders, which extends `nf-nsautoapprvd1`. */
export const buildNfNsapprvd1Context = (
  overrides: Partial<NfNsapprvd1Context> = {}
): NfNsapprvd1Context => ({
  ...buildNfNsautoapprvd1Context(),
  namespace_created_on: faker.date.recent().toISOString(),
  moderator_username: faker.internet.username(),
  ...overrides,
});

/** The context `nf-nsapprvd2` renders, which extends `nf-nsautoapprvd1`. */
export const buildNfNsapprvd2Context = (
  overrides: Partial<NfNsapprvd2Context> = {}
): NfNsapprvd2Context => ({
  ...buildNfNsautoapprvd1Context(),
  requester_username: faker.internet.username(),
  moderator_username: faker.internet.username(),
  ...overrides,
});

/** The context `nf-nsautoapprvd1` renders. */
export const buildNfNsautoapprvd1Context = (
  overrides: Partial<NfNsautoapprvd1Context> = {}
): NfNsautoapprvd1Context => ({
  namespace_id: faker.number.int({ min: 1, max: 999 }),
  namespace_created_on: faker.date.recent().toISOString(),
  namespace_value: faker.internet.domainName(),
  platform: faker.number.int({ min: 0, max: 2 }),
  platform_display: platformName(),
  ...overrides,
});

/** The context `nf-nsautoapprvd2` renders, which extends `nf-nsautoapprvd1`. */
export const buildNfNsautoapprvd2Context = (
  overrides: Partial<NfNsautoapprvd2Context> = {}
): NfNsautoapprvd2Context => ({
  ...buildNfNsautoapprvd1Context(),
  requester_username: faker.internet.username(),
  ...overrides,
});

/** The context `nf-nsrejctd1` renders, which matches `nf-nsapprvd1`. */
export const buildNfNsrejctd1Context = (
  overrides: Partial<NfNsrejctd1Context> = {}
): NfNsrejctd1Context => ({
  ...buildNfNsapprvd1Context(),
  ...overrides,
});

/** The context `nf-nsrejctd2` renders, which matches `nf-nsapprvd2`. */
export const buildNfNsrejctd2Context = (
  overrides: Partial<NfNsrejctd2Context> = {}
): NfNsrejctd2Context => ({
  ...buildNfNsapprvd2Context(),
  ...overrides,
});

/** The context `nf-nsreqstd1` renders, which extends `nf-nsautoapprvd1`. */
export const buildNfNsreqstd1Context = (
  overrides: Partial<NfNsreqstd1Context> = {}
): NfNsreqstd1Context => ({
  ...buildNfNsautoapprvd1Context(),
  namespace_id: faker.number.int({ min: 1, max: 999 }),
  requester_username: faker.internet.username(),
  store_url: storeUrl(),
  ...overrides,
});

/** The context `nf-nsreqstd2` renders, which extends `nf-nsautoapprvd1`. */
export const buildNfNsreqstd2Context = (
  overrides: Partial<NfNsreqstd2Context> = {}
): NfNsreqstd2Context => ({
  ...buildNfNsautoapprvd1Context(),
  namespace_id: faker.number.int({ min: 1, max: 999 }),
  namespace_created_on: faker.date.recent().toISOString(),
  initial_requester_username: faker.internet.username(),
  current_requester_username: faker.internet.username(),
  store_url: storeUrl(),
  ...overrides,
});

/** The context `nf-ovrreq-approved` renders, which extends `nf-ovrreq-raised`. */
export const buildNfOvrreqApprovedContext = (
  overrides: Partial<NfOvrreqApprovedContext> = {}
): NfOvrreqApprovedContext => ({
  ...buildNfOvrreqRaisedContext(),
  reviewer_username: faker.internet.username(),
  reviewer_email: faker.internet.email(),
  ...overrides,
});

/** The context `nf-ovrreq-approved-reqstr` renders, which matches `nf-ovrreq-approved`. */
export const buildNfOvrreqApprovedReqstrContext = (
  overrides: Partial<NfOvrreqApprovedReqstrContext> = {}
): NfOvrreqApprovedReqstrContext => ({
  ...buildNfOvrreqApprovedContext(),
  ...overrides,
});

/** The context `nf-ovrreq-raised` renders. */
export const buildNfOvrreqRaisedContext = (
  overrides: Partial<NfOvrreqRaisedContext> = {}
): NfOvrreqRaisedContext => ({
  file_id: faker.number.int({ min: 1, max: 99999 }),
  analysis_id: faker.number.int({ min: 1, max: 99999 }),
  vulnerability_id: faker.number.int({ min: 1, max: 99999 }),
  requester_username: faker.internet.username(),
  requester_email: faker.internet.email(),
  override_request_uuid: faker.string.uuid(),
  ...overrides,
});

/** The context `nf-ovrreq-rejected` renders, which extends `nf-ovrreq-raised`. */
export const buildNfOvrreqRejectedContext = (
  overrides: Partial<NfOvrreqRejectedContext> = {}
): NfOvrreqRejectedContext => ({
  ...buildNfOvrreqRaisedContext(),
  rejection_reason: faker.lorem.sentence(),
  reviewer_username: faker.internet.username(),
  reviewer_email: faker.internet.email(),
  ...overrides,
});

/** The context `nf-public-api-user-updated` renders. */
export const buildNfPublicApiUserUpdatedContext = (
  overrides: Partial<NfPublicApiUserUpdatedContext> = {}
): NfPublicApiUserUpdatedContext => ({
  type: faker.helpers.arrayElement(['Role', 'Scope']),
  user_email: faker.internet.email(),
  current: faker.word.noun(),
  updated: faker.word.noun(),
  changed_by: faker.internet.username(),
  ...overrides,
});

/** The context `nf-sastcmpltd1` renders, which extends `nf-apistcmpltd1`. */
export const buildNfSastcmpltd1Context = (
  overrides: Partial<NfSastcmpltd1Context> = {}
): NfSastcmpltd1Context => ({
  ...buildNfApistcmpltd1Context(),
  submission_source_display: faker.word.noun(),
  ...overrides,
});

/** The context `nf-sbom-comp-update` renders. */
export const buildNfSbomCompUpdateContext = (
  overrides: Partial<NfSbomCompUpdateContext> = {}
): NfSbomCompUpdateContext => ({
  component_name: componentName(),
  old_version: faker.system.semver(),
  new_version: faker.system.semver(),
  source: faker.word.noun(),
  affected_apps_count: faker.number.int({ min: 1, max: 999 }),
  name: faker.word.noun(),
  registry_url: faker.internet.url(),
  ...overrides,
});

/** The context `nf-sbom-vuln-update` renders. */
export const buildNfSbomVulnUpdateContext = (
  overrides: Partial<NfSbomVulnUpdateContext> = {}
): NfSbomVulnUpdateContext => ({
  component_name: componentName(),
  ghsa_ids: ghsaIds(),
  max_severity: faker.helpers.arrayElement(['Low', 'Medium', 'High', 'Critical']),
  fixed_version: faker.system.semver(),
  affected_apps_count: faker.number.int({ min: 1, max: 999 }),
  name: faker.word.noun(),
  advisory_urls: [faker.internet.url()],
  ...overrides,
});

/** The context `nf-sbomcmpltd` renders. */
export const buildNfSbomcmpltdContext = (
  overrides: Partial<NfSbomcmpltdContext> = {}
): NfSbomcmpltdContext => ({
  package_name: packageName(),
  platform: faker.number.int({ min: 0, max: 2 }),
  platform_display: platformName(),
  file_id: faker.number.int({ min: 1, max: 99999 }),
  file_name: faker.commerce.productName(),
  version: faker.system.semver(),
  version_code: String(faker.number.int({ min: 1, max: 9999 })),
  sb_project_id: faker.number.int({ min: 1, max: 99999 }),
  sb_file_id: faker.number.int({ min: 1, max: 99999 }),
  components_with_updates_count: faker.number.int({ min: 1, max: 999 }),
  vulnerable_components_count: faker.number.int({ min: 1, max: 999 }),
  components_count: faker.number.int({ min: 1, max: 999 }),
  ...overrides,
});

/** The context `nf-sk-newversn` renders. */
export const buildNfSkNewversnContext = (
  overrides: Partial<NfSkNewversnContext> = {}
): NfSkNewversnContext => ({
  package_name: packageName(),
  app_name: faker.commerce.productName(),
  sk_app_version_id: faker.number.int({ min: 1, max: 999 }),
  sk_app_id: faker.number.int({ min: 1, max: 99999 }),
  project_id: faker.number.int({ min: 1, max: 999 }),
  platform: faker.number.int({ min: 0, max: 2 }),
  platform_display: platformName(),
  version_unscanned: faker.system.semver(),
  version_scanned: faker.system.semver(),
  ...overrides,
});

/** The context `nf-sk-subexp` renders. */
export const buildNfSkSubexpContext = (
  overrides: Partial<NfSkSubexpContext> = {}
): NfSkSubexpContext => ({
  organization_name: faker.company.name(),
  weeks_remaining: faker.number.int({ min: 1, max: 999 }),
  subscription_end_date: faker.date.recent().toISOString(),
  is_trial: false,
  ...overrides,
});

/** The context `nf-str-url-nsreqstd1` renders, which matches `nf-nsreqstd1`. */
export const buildNfStrUrlNsreqstd1Context = (
  overrides: Partial<NfStrUrlNsreqstd1Context> = {}
): NfStrUrlNsreqstd1Context => ({
  ...buildNfNsreqstd1Context(),
  store_url: storeUrl(),
  ...overrides,
});

/** The context `nf-str-url-nsreqstd2` renders, which matches `nf-nsreqstd2`. */
export const buildNfStrUrlNsreqstd2Context = (
  overrides: Partial<NfStrUrlNsreqstd2Context> = {}
): NfStrUrlNsreqstd2Context => ({
  ...buildNfNsreqstd2Context(),
  store_url: storeUrl(),
  ...overrides,
});

/** The context `nf-str-url-upldfailnprjdeny1` renders, which extends `nf-str-url-vldtn-err`. */
export const buildNfStrUrlUpldfailnprjdeny1Context = (
  overrides: Partial<NfStrUrlUpldfailnprjdeny1Context> = {}
): NfStrUrlUpldfailnprjdeny1Context => ({
  ...buildNfStrUrlVldtnErrContext(),
  package_name: packageName(),
  platform: faker.number.int({ min: 0, max: 2 }),
  platform_display: platformName(),
  ...overrides,
});

/** The context `nf-str-url-upldfailnprjdeny2` renders, which extends `nf-str-url-vldtn-err`. */
export const buildNfStrUrlUpldfailnprjdeny2Context = (
  overrides: Partial<NfStrUrlUpldfailnprjdeny2Context> = {}
): NfStrUrlUpldfailnprjdeny2Context => ({
  ...buildNfStrUrlVldtnErrContext(),
  project_id: faker.number.int({ min: 1, max: 99999 }),
  package_name: packageName(),
  platform: faker.number.int({ min: 0, max: 2 }),
  platform_display: platformName(),
  requester_username: faker.internet.username(),
  requester_role: faker.helpers.arrayElement(['Member', 'Admin', 'Owner']),
  ...overrides,
});

/** The context `nf-str-url-upldfailnscreatd1` renders, which extends `nf-str-url-vldtn-err`. */
export const buildNfStrUrlUpldfailnscreatd1Context = (
  overrides: Partial<NfStrUrlUpldfailnscreatd1Context> = {}
): NfStrUrlUpldfailnscreatd1Context => ({
  ...buildNfStrUrlVldtnErrContext(),
  namespace_value: faker.internet.domainName(),
  platform: faker.number.int({ min: 0, max: 2 }),
  platform_display: platformName(),
  ...overrides,
});

/** The context `nf-str-url-upldfailnsunaprv1` renders, which matches `nf-str-url-upldfailnscreatd1`. */
export const buildNfStrUrlUpldfailnsunaprv1Context = (
  overrides: Partial<NfStrUrlUpldfailnsunaprv1Context> = {}
): NfStrUrlUpldfailnsunaprv1Context => ({
  ...buildNfStrUrlUpldfailnscreatd1Context(),
  ...overrides,
});

/** The context `nf-str-url-upldfailpay2` renders, which extends `nf-str-url-vldtn-err`. */
export const buildNfStrUrlUpldfailpay2Context = (
  overrides: Partial<NfStrUrlUpldfailpay2Context> = {}
): NfStrUrlUpldfailpay2Context => ({
  ...buildNfStrUrlVldtnErrContext(),
  package_name: packageName(),
  requester_username: faker.internet.username(),
  ...overrides,
});

/** The context `nf-str-url-upldfailpayrq1` renders, which extends `nf-str-url-vldtn-err`. */
export const buildNfStrUrlUpldfailpayrq1Context = (
  overrides: Partial<NfStrUrlUpldfailpayrq1Context> = {}
): NfStrUrlUpldfailpayrq1Context => ({
  ...buildNfStrUrlVldtnErrContext(),
  package_name: packageName(),
  ...overrides,
});

/** The context `nf-str-url-upload-success` renders, which extends `nf-systm-file-upload-success`. */
export const buildNfStrUrlUploadSuccessContext = (
  overrides: Partial<NfStrUrlUploadSuccessContext> = {}
): NfStrUrlUploadSuccessContext => ({
  ...buildNfSystmFileUploadSuccessContext(),
  store_url: storeUrl(),
  ...overrides,
});

/** The context `nf-str-url-vldtn-err` renders. */
export const buildNfStrUrlVldtnErrContext = (
  overrides: Partial<NfStrUrlVldtnErrContext> = {}
): NfStrUrlVldtnErrContext => ({
  store_url: storeUrl(),
  error_message: faker.lorem.sentence(),
  ...overrides,
});

/** The context `nf-systm-file-upload-success` renders. */
export const buildNfSystmFileUploadSuccessContext = (
  overrides: Partial<NfSystmFileUploadSuccessContext> = {}
): NfSystmFileUploadSuccessContext => ({
  package_name: packageName(),
  platform: faker.number.int({ min: 0, max: 2 }),
  platform_display: platformName(),
  file_id: faker.number.int({ min: 1, max: 99999 }),
  version: faker.system.semver(),
  version_code: String(faker.number.int({ min: 1, max: 9999 })),
  ...overrides,
});

/** The context `nf-upldfailnprjdeny1` renders, which extends `nf-upldfailpayrq1`. */
export const buildNfUpldfailnprjdeny1Context = (
  overrides: Partial<NfUpldfailnprjdeny1Context> = {}
): NfUpldfailnprjdeny1Context => ({
  ...buildNfUpldfailpayrq1Context(),
  platform: faker.number.int({ min: 0, max: 2 }),
  platform_display: platformName(),
  ...overrides,
});

/** The context `nf-upldfailnprjdeny2` renders, which extends `nf-upldfailpayrq1`. */
export const buildNfUpldfailnprjdeny2Context = (
  overrides: Partial<NfUpldfailnprjdeny2Context> = {}
): NfUpldfailnprjdeny2Context => ({
  ...buildNfUpldfailpayrq1Context(),
  project_id: faker.number.int({ min: 1, max: 99999 }),
  platform: faker.number.int({ min: 0, max: 2 }),
  platform_display: platformName(),
  requester_username: faker.internet.username(),
  requester_role: faker.helpers.arrayElement(['Member', 'Admin', 'Owner']),
  ...overrides,
});

/** The context `nf-upldfailnscreatd1` renders. */
export const buildNfUpldfailnscreatd1Context = (
  overrides: Partial<NfUpldfailnscreatd1Context> = {}
): NfUpldfailnscreatd1Context => ({
  namespace_value: faker.internet.domainName(),
  platform: faker.number.int({ min: 0, max: 2 }),
  platform_display: platformName(),
  ...overrides,
});

/** The context `nf-upldfailnsunaprv1` renders, which matches `nf-upldfailnscreatd1`. */
export const buildNfUpldfailnsunaprv1Context = (
  overrides: Partial<NfUpldfailnsunaprv1Context> = {}
): NfUpldfailnsunaprv1Context => ({
  ...buildNfUpldfailnscreatd1Context(),
  ...overrides,
});

/** The context `nf-upldfailpay2` renders, which extends `nf-upldfailpayrq1`. */
export const buildNfUpldfailpay2Context = (
  overrides: Partial<NfUpldfailpay2Context> = {}
): NfUpldfailpay2Context => ({
  ...buildNfUpldfailpayrq1Context(),
  requester_username: faker.internet.username(),
  ...overrides,
});

/** The context `nf-upldfailpayrq1` renders. */
export const buildNfUpldfailpayrq1Context = (
  overrides: Partial<NfUpldfailpayrq1Context> = {}
): NfUpldfailpayrq1Context => ({
  package_name: packageName(),
  ...overrides,
});

/**
 * Each notification code paired with the builder for the context it carries.
 *
 * The map test renders every code from its own shape rather than from one object
 * carrying every field, so a message that needs a field its notification never
 * sends fails here instead of passing on a superset.
 */
export const NOTIFICATION_CONTEXT_BUILDERS = {
  NF_AM_NEWVERSN: buildNfAmNewversnContext,
  NF_APISTCMPLTD1: buildNfApistcmpltd1Context,
  NF_AUTOMATED_DAST_COMPLETED: buildNfAutomatedDastCompletedContext,
  NF_AUTOMATED_DAST_ERRORED: buildNfAutomatedDastErroredContext,
  NF_AUTOMATED_DAST_IN_PROGRESS: buildNfAutomatedDastInProgressContext,
  NF_AUTOMATED_DAST_PARTIALLY_COMPLETED: buildNfAutomatedDastPartiallyCompletedContext,
  NF_DASTCMPLTD1: buildNfDastcmpltd1Context,
  NF_JIRA_PUSH_ERR: buildNfJiraPushErrContext,
  NF_NSAPPRVD1: buildNfNsapprvd1Context,
  NF_NSAPPRVD2: buildNfNsapprvd2Context,
  NF_NSAUTOAPPRVD1: buildNfNsautoapprvd1Context,
  NF_NSAUTOAPPRVD2: buildNfNsautoapprvd2Context,
  NF_NSREJCTD1: buildNfNsrejctd1Context,
  NF_NSREJCTD2: buildNfNsrejctd2Context,
  NF_NSREQSTD1: buildNfNsreqstd1Context,
  NF_NSREQSTD2: buildNfNsreqstd2Context,
  NF_OVRREQ_APPROVED: buildNfOvrreqApprovedContext,
  NF_OVRREQ_APPROVED_REQSTR: buildNfOvrreqApprovedReqstrContext,
  NF_OVRREQ_RAISED: buildNfOvrreqRaisedContext,
  NF_OVRREQ_REJECTED: buildNfOvrreqRejectedContext,
  NF_PUBLIC_API_USER_UPDATED: buildNfPublicApiUserUpdatedContext,
  NF_SASTCMPLTD1: buildNfSastcmpltd1Context,
  NF_SBOM_COMP_UPDATE: buildNfSbomCompUpdateContext,
  NF_SBOM_VULN_UPDATE: buildNfSbomVulnUpdateContext,
  NF_SBOMCMPLTD: buildNfSbomcmpltdContext,
  NF_SK_NEWVERSN: buildNfSkNewversnContext,
  NF_SK_SUBEXP: buildNfSkSubexpContext,
  NF_STR_URL_NSREQSTD1: buildNfStrUrlNsreqstd1Context,
  NF_STR_URL_NSREQSTD2: buildNfStrUrlNsreqstd2Context,
  NF_STR_URL_UPLDFAILNPRJDENY1: buildNfStrUrlUpldfailnprjdeny1Context,
  NF_STR_URL_UPLDFAILNPRJDENY2: buildNfStrUrlUpldfailnprjdeny2Context,
  NF_STR_URL_UPLDFAILNSCREATD1: buildNfStrUrlUpldfailnscreatd1Context,
  NF_STR_URL_UPLDFAILNSUNAPRV1: buildNfStrUrlUpldfailnsunaprv1Context,
  NF_STR_URL_UPLDFAILPAY2: buildNfStrUrlUpldfailpay2Context,
  NF_STR_URL_UPLDFAILPAYRQ1: buildNfStrUrlUpldfailpayrq1Context,
  NF_STR_URL_UPLOAD_SUCCESS: buildNfStrUrlUploadSuccessContext,
  NF_STR_URL_VLDTN_ERR: buildNfStrUrlVldtnErrContext,
  NF_SYSTM_FILE_UPLOAD_SUCCESS: buildNfSystmFileUploadSuccessContext,
  NF_UPLDFAILNPRJDENY1: buildNfUpldfailnprjdeny1Context,
  NF_UPLDFAILNPRJDENY2: buildNfUpldfailnprjdeny2Context,
  NF_UPLDFAILNSCREATD1: buildNfUpldfailnscreatd1Context,
  NF_UPLDFAILNSUNAPRV1: buildNfUpldfailnsunaprv1Context,
  NF_UPLDFAILPAY2: buildNfUpldfailpay2Context,
  NF_UPLDFAILPAYRQ1: buildNfUpldfailpayrq1Context,
} as const;

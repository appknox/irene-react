import { API_NAMESPACES } from '@irene/api/namespaces';

/** Paths for the organization an account belongs to, and what it is entitled to. */
export const OrganizationEndpoints = {
  list: () => `${API_NAMESPACES.v1}/organizations` as const,

  /** The signed-in account's standing within one organization: role, permissions, last seen. */
  me: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/me` as const,

  /** The teams an organization has, a page at a time, searchable by name. */
  teams: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/teams` as const,

  /** One team, by the id another record refers to it by. */
  team: (organizationId: number | string, teamId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/teams/${encodeURIComponent(teamId)}` as const,

  /** The people in one team, a page at a time. Each entry carries the member's id alone. */
  teamMembers: (organizationId: number | string, teamId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/teams/${encodeURIComponent(teamId)}/members` as const,

  /** One person's place in a team, which is added to and taken out of it here. */
  teamMember: (organizationId: number | string, teamId: number | string, userId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/teams/${encodeURIComponent(teamId)}/members/${encodeURIComponent(userId)}` as const,

  /** The projects one team works on, a page at a time. */
  teamProjects: (organizationId: number | string, teamId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/teams/${encodeURIComponent(teamId)}/projects` as const,

  /** One project's place in a team: added, removed, and its write access set here. */
  teamProject: (
    organizationId: number | string,
    teamId: number | string,
    projectId: number | string
  ) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/teams/${encodeURIComponent(teamId)}/projects/${encodeURIComponent(projectId)}` as const,

  /** The invitations one team has open, and where a new one is sent from. */
  teamInvitations: (organizationId: number | string, teamId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/teams/${encodeURIComponent(teamId)}/invitations` as const,

  /** Everyone in an organization, as the records that only carry a member's id read them. */
  users: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/users` as const,

  /** An organization's projects, which a team's are drawn from. */
  projects: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/projects` as const,

  /** The invitations an organization has open, and where a new one is sent from. */
  invitations: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/invitations` as const,

  /** One invitation, which may be withdrawn. */
  invitation: (organizationId: number | string, invitationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/invitations/${encodeURIComponent(invitationId)}` as const,

  /** Sends one invitation again. */
  resendInvitation: (organizationId: number | string, invitationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/invitations/${encodeURIComponent(invitationId)}/resend` as const,

  /** Everyone in an organization, a page at a time, searchable by name or email. */
  members: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/members` as const,

  /** One member's standing: their role, when they joined, and when they were last seen. */
  member: (organizationId: number | string, userId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/members/${encodeURIComponent(userId)}` as const,

  /** One organization, which an owner may rename. */
  detail: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}` as const,

  /** One member of an organization, by the id another record refers to them by. */
  user: (organizationId: number | string, userId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/users/${encodeURIComponent(userId)}` as const,

  /** Every namespace an organization has claimed, a page at a time. */
  namespaces: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/namespaces` as const,

  /** One namespace an organization has claimed, which a moderator approves or rejects. */
  namespace: (organizationId: number | string, namespaceId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/namespaces/${encodeURIComponent(namespaceId)}` as const,

  /** Which of the organization's AI features are switched on, read and written here. */
  aiFeatures: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/ai_features` as const,

  /** Whether members may ask to override an analysis, which an owner turns here. */
  memberOverrideRequestFeature: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/member_override_request_feature` as const,

  /** Which regulations an organization's reports carry, read and written whole. */
  preference: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/preference` as const,

  /** The email domains an organization restricts its accounts to. */
  emailDomains: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/email_domains` as const,

  /** One of those domains, which is removed here. */
  emailDomain: (organizationId: number | string, domainId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/email_domains/${encodeURIComponent(domainId)}` as const,

  /** The devices members have registered, for an organization that allows it. */
  registeredDevices: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/registered-devices` as const,

  /** Whether single sign-on is on for an organization, and whether it is the only way in. */
  sso: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/sso/provider` as const,

  /** The identity provider's own metadata: read, uploaded and removed here. */
  samlIdpMetadata: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/sso/saml2/idp_metadata` as const,

  /** What an identity provider needs to know about Appknox, which is the same for everyone. */
  samlSpMetadata: () => `${API_NAMESPACES.v2}/sso/saml2/metadata` as const,

  /** The OpenID Connect provider an organization has set up: read, added and removed here. */
  oidcProvider: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/sso/oidc` as const,

  /** The iOS signing certificates an organization holds, and where one is uploaded. */
  signingCertificates: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/signing-certificates/` as const,

  /** One of those certificates, which is removed here. */
  signingCertificate: (organizationId: number | string, certificateId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/signing-certificates/${encodeURIComponent(certificateId)}/` as const,

  /** Where one of them is made the one apps are re-signed with. */
  activateSigningCertificate: (organizationId: number | string, certificateId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/signing-certificates/${encodeURIComponent(certificateId)}/activate/` as const,

  /** The archive exports an organization has asked for, and where one is asked for. */
  archives: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/archives` as const,

  /** Where one archive's file is fetched from, which is answered as a link. */
  archiveDownloadUrl: (organizationId: number | string, archiveId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/archives/${encodeURIComponent(archiveId)}/download_url` as const,

  /** Where an export of each project's latest scan is asked for, which has its own path. */
  latestScanArchive: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/archives/generate_excel_project_latest_scans` as const,

  /** Whether old binaries are cleaned up, and how many are kept: read and written here. */
  cleanupPreference: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/cleanup-preference` as const,

  /** The cleanups that have run, and where one is started by hand. */
  cleanups: (organizationId: number | string) =>
    `${API_NAMESPACES.v1}/organizations/${encodeURIComponent(organizationId)}/cleanups` as const,

  /** The StoreKnox organization, which not every deployment has. */
  storeknoxOrganization: () => `${API_NAMESPACES.v2}/sk_organization` as const,
};

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

  /** The StoreKnox organization, which not every deployment has. */
  storeknoxOrganization: () => `${API_NAMESPACES.v2}/sk_organization` as const,
};

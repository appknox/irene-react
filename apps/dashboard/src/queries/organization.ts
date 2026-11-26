import { queryOptions } from '@tanstack/react-query';
import { OrganizationService } from '@irene/api/services/organization';

/** The cache keys for the organization a signed-in account works in. */
export const organizationKeys = {
  all: () => ['organization'] as const,
  list: () => [...organizationKeys.all(), 'list'] as const,
  storeknox: () => [...organizationKeys.all(), 'storeknox'] as const,
  me: (orgId: number | string) => [...organizationKeys.all(), 'me', orgId] as const,

  membership: (orgId: number | string, userId: number | string) =>
    [...organizationKeys.all(), 'membership', orgId, userId] as const,

  namespace: (orgId: number | undefined, namespaceId: number) =>
    [...organizationKeys.all(), orgId, 'namespace', namespaceId] as const,

  /** Every page of the organization's open invitations, for invalidating them together. */
  invitationsList: (orgId: number | undefined) =>
    [...organizationKeys.all(), orgId, 'invitations'] as const,

  invitations: (orgId: number | undefined, page: Record<string, unknown>) =>
    [...organizationKeys.invitationsList(orgId), page] as const,

  /** Every page of the teams list, for invalidating them together. */
  teamsList: (orgId: number | undefined) => [...organizationKeys.all(), orgId, 'teams'] as const,

  teams: (orgId: number | undefined, page: Record<string, unknown>) =>
    [...organizationKeys.teamsList(orgId), page] as const,

  /** Every page of the organization's members, for invalidating them together. */
  membersList: (orgId: number | undefined) =>
    [...organizationKeys.all(), orgId, 'members'] as const,

  members: (orgId: number | undefined, page: Record<string, unknown>) =>
    [...organizationKeys.membersList(orgId), page] as const,

  user: (orgId: number | undefined, userId: number) =>
    [...organizationKeys.all(), orgId, 'user', userId] as const,

  team: (orgId: number | undefined, teamId: number) =>
    [...organizationKeys.all(), orgId, 'team', teamId] as const,

  namespaces: (orgId: number | undefined, limit: number, offset: number) =>
    [...organizationKeys.all(), orgId, 'namespaces', { limit, offset }] as const,

  /**
   * Every page of one of a team's own lists.
   *
   * What a change to a team touches is one of these, so each is invalidated on
   * its own rather than through everything the organization holds: adding a
   * project must not send the team's members and invitations round again.
   */
  teamRecords: (
    orgId: number | undefined,
    teamId: number | undefined,
    records: 'members' | 'projects' | 'invitations'
  ) => [...organizationKeys.all(), orgId, 'team', teamId, records] as const,

  teamMembers: (
    orgId: number | undefined,
    teamId: number | undefined,
    page: Record<string, unknown>
  ) => [...organizationKeys.teamRecords(orgId, teamId, 'members'), page] as const,

  teamProjects: (
    orgId: number | undefined,
    teamId: number | undefined,
    page: Record<string, unknown>
  ) => [...organizationKeys.teamRecords(orgId, teamId, 'projects'), page] as const,

  teamInvitations: (
    orgId: number | undefined,
    teamId: number | undefined,
    page: Record<string, unknown>
  ) => [...organizationKeys.teamRecords(orgId, teamId, 'invitations'), page] as const,

  aiFeatures: (orgId: number | undefined) =>
    [...organizationKeys.all(), orgId, 'ai-features'] as const,

  preference: (orgId: number | undefined) =>
    [...organizationKeys.all(), orgId, 'preference'] as const,

  sso: (orgId: number | undefined) => [...organizationKeys.all(), orgId, 'sso'] as const,

  samlIdpMetadata: (orgId: number | undefined) =>
    [...organizationKeys.all(), orgId, 'saml-idp-metadata'] as const,

  samlSpMetadata: () => [...organizationKeys.all(), 'saml-sp-metadata'] as const,

  oidcProvider: (orgId: number | undefined) =>
    [...organizationKeys.all(), orgId, 'oidc-provider'] as const,

  signingCertificates: (orgId: number | undefined) =>
    [...organizationKeys.all(), orgId, 'signing-certificates'] as const,

  archivesList: (orgId: number | undefined) =>
    [...organizationKeys.all(), orgId, 'archives'] as const,

  archives: (orgId: number | undefined, page: { limit: number; offset: number }) =>
    [...organizationKeys.archivesList(orgId), page] as const,

  cleanupPreference: (orgId: number | undefined) =>
    [...organizationKeys.all(), orgId, 'cleanup-preference'] as const,

  cleanupsList: (orgId: number | undefined) =>
    [...organizationKeys.all(), orgId, 'cleanups'] as const,

  cleanups: (orgId: number | undefined, page: { limit: number; offset: number }) =>
    [...organizationKeys.cleanupsList(orgId), page] as const,

  registeredDevices: (orgId: number | undefined) =>
    [...organizationKeys.all(), orgId, 'registered-devices'] as const,

  emailDomains: (orgId: number | undefined) =>
    [...organizationKeys.all(), orgId, 'email-domains'] as const,

  /** Every page of the organization's people, for invalidating them together. */
  usersList: (orgId: number | undefined) => [...organizationKeys.all(), orgId, 'users'] as const,

  users: (orgId: number | undefined, page: Record<string, unknown>) =>
    [...organizationKeys.usersList(orgId), page] as const,

  /** Every page of the organization's projects, for invalidating them together. */
  projectsList: (orgId: number | undefined) =>
    [...organizationKeys.all(), orgId, 'projects'] as const,

  projects: (orgId: number | undefined, page: Record<string, unknown>) =>
    [...organizationKeys.projectsList(orgId), page] as const,
};

/**
 * Builds the query for the organizations this account belongs to.
 *
 * @returns Query options resolving to one page of organizations.
 */
export const organizationsOptions = () =>
  queryOptions({
    queryKey: organizationKeys.list(),
    queryFn: () => OrganizationService.getOrganizations(),
    staleTime: Infinity,
  });

/**
 * Builds the query for what this account may do in one organization.
 *
 * @param orgId - The organization to ask about.
 * @returns Query options resolving to the account's role and permissions.
 */
export const organizationMeOptions = (orgId: number | string) =>
  queryOptions({
    queryKey: organizationKeys.me(orgId),
    queryFn: () => OrganizationService.getOrganizationMe(orgId),
    staleTime: Infinity,
  });

/**
 * Builds the query for one account's membership of an organization.
 *
 * @param orgId - The organization the membership is in.
 * @param userId - The account whose membership to read.
 * @returns Query options resolving to their role, and when they joined.
 */
export const organizationMembershipOptions = (orgId: number | string, userId: number | string) =>
  queryOptions({
    queryKey: organizationKeys.membership(orgId, userId),
    queryFn: () => OrganizationService.getOrganizationMembership(orgId, userId),
    staleTime: Infinity,
  });

/**
 * Builds the query for the StoreKnox organization.
 *
 * Fails on a deployment without StoreKnox, which is not an error: the caller
 * carries on without it.
 *
 * @returns Query options resolving to the StoreKnox organization.
 */
export const storeknoxOrganizationOptions = () =>
  queryOptions({
    queryKey: organizationKeys.storeknox(),
    queryFn: () => OrganizationService.getStoreknoxOrganization(),
    staleTime: Infinity,
    retry: false,
  });

/**
 * Builds the query for one namespace an organization has claimed.
 *
 * The namespace-request notifications read it to state whether the request is
 * still open. It is not retried: a rejected namespace is removed, and the 404
 * that follows is the answer rather than a failure.
 *
 * @param orgId - The organization the namespace belongs to, absent until one is selected.
 * @param namespaceId - The namespace to read.
 * @returns Query options resolving to the namespace, which only run once an organization is selected.
 */
export const organizationNamespaceOptions = (orgId: number | undefined, namespaceId: number) =>
  queryOptions({
    queryKey: organizationKeys.namespace(orgId, namespaceId),
    queryFn: () => OrganizationService.getOrganizationNamespace(Number(orgId), namespaceId),
    enabled: orgId !== undefined,
    retry: false,
  });

/**
 * Builds the query for one page of the namespaces an organization has claimed.
 *
 * The page is held while another is read, so the table keeps the rows it has
 * rather than emptying between pages.
 *
 * @param orgId - The organization whose namespaces to read, absent until one is selected.
 * @param page.limit - How many to read.
 * @param page.offset - How many to skip.
 * @returns Query options resolving to the page, which only run once an organization is selected.
 */
export const organizationNamespacesOptions = (
  orgId: number | undefined,
  { limit, offset }: { limit: number; offset: number }
) =>
  queryOptions({
    queryKey: organizationKeys.namespaces(orgId, limit, offset),
    queryFn: () => OrganizationService.getOrganizationNamespaces(Number(orgId), { limit, offset }),
    enabled: orgId !== undefined,
    placeholderData: (previous) => previous,
  });

/**
 * Builds the query for one member of an organization.
 *
 * The records that refer to a member carry only their id, so a screen that
 * names them reads the member here. A member's name rarely changes, so it is
 * held for the life of the tab and shared by every row that names them.
 *
 * @param orgId - The organization they belong to, absent until one is selected.
 * @param userId - The member to read, absent on a record that names none.
 * @returns Query options resolving to the member, which only run once both are known.
 */
export const organizationUserOptions = (orgId: number | undefined, userId: number | null) =>
  queryOptions({
    queryKey: organizationKeys.user(orgId, Number(userId)),
    queryFn: () => OrganizationService.getOrganizationUser(Number(orgId), Number(userId)),
    enabled: orgId !== undefined && userId !== null,
    staleTime: Infinity,
  });

/**
 * Builds the query for one team, by the id another record refers to it by.
 *
 * @param orgId - The organization the team belongs to, absent until one is selected.
 * @param teamId - The team to read, absent on a record that names none.
 * @returns Query options resolving to the team, which only run once both are known.
 */
export const organizationTeamOptions = (orgId: number | undefined, teamId: number | null) =>
  queryOptions({
    queryKey: organizationKeys.team(orgId, Number(teamId)),
    queryFn: () => OrganizationService.getOrganizationTeam(Number(orgId), Number(teamId)),
    enabled: orgId !== undefined && teamId !== null,
    staleTime: Infinity,
  });

/** What a page of members asks for: where it starts, how many, and what it searches. */
export interface OrganizationMemberPage {
  limit: number;
  offset: number;
  query?: string;
  includeInactive?: boolean;
}

/**
 * Builds the query for one page of an organization's members.
 *
 * The page is held while another is read, so the table keeps the rows it has
 * rather than emptying between pages or while a search is typed.
 *
 * @param orgId - The organization whose members to read, absent until one is selected.
 * @param page - Where the page starts, how many it holds, and what it searches.
 * @returns Query options resolving to the page, which only run once an organization is selected.
 */
export const organizationMembersOptions = (
  orgId: number | undefined,
  page: OrganizationMemberPage
) =>
  queryOptions({
    queryKey: organizationKeys.members(orgId, { ...page }),
    queryFn: () => OrganizationService.getOrganizationMembers(Number(orgId), page),
    enabled: orgId !== undefined,
    placeholderData: (previous) => previous,
  });

/** What a page of teams asks for: where it starts, how many, and what it searches. */
export interface OrganizationTeamPage {
  limit: number;
  offset: number;
  query?: string;

  /** A member, to read the teams they are in alone. */
  includeUser?: number;

  /** A member, to read the teams they are not in, for adding them to one. */
  excludeUser?: number;
}

/**
 * Builds the query for one page of an organization's teams.
 *
 * The page is held while another is read, so the list keeps what it has rather
 * than emptying between pages or while a search is typed.
 *
 * @param orgId - The organization whose teams to read, absent until one is selected.
 * @param page - Where the page starts, how many it holds, and what it searches.
 * @returns Query options resolving to the page, which only run once an organization is selected.
 */
export const organizationTeamsOptions = (orgId: number | undefined, page: OrganizationTeamPage) =>
  queryOptions({
    queryKey: organizationKeys.teams(orgId, { ...page }),
    queryFn: () => OrganizationService.getOrganizationTeams(Number(orgId), page),
    enabled: orgId !== undefined,
    placeholderData: (previous) => previous,
  });

/**
 * Builds the query for one page of an organization's open invitations.
 *
 * @param orgId - The organization whose invitations to read, absent until one is selected.
 * @param page - Where the page starts and how many it holds.
 * @returns Query options resolving to the page, which only run once an organization is selected.
 */
export const organizationInvitationsOptions = (
  orgId: number | undefined,
  page: { limit: number; offset: number }
) =>
  queryOptions({
    queryKey: organizationKeys.invitations(orgId, { ...page }),
    queryFn: () => OrganizationService.getOrganizationInvitations(Number(orgId), page),
    enabled: orgId !== undefined,
    placeholderData: (previous) => previous,
  });

/** What a page of a team's own records asks for: where it starts, how many, and what it searches. */
export interface OrganizationTeamRecordPage {
  limit: number;
  offset: number;
  query?: string;
}

/**
 * Builds the query for one page of a team's members.
 *
 * Each entry carries the member's id alone, so a row reads the person behind
 * it with `organizationUserOptions`.
 *
 * @param orgId - The organization the team belongs to, absent until one is selected.
 * @param teamId - The team whose members to read, absent while no team is open.
 * @param page - Where the page starts, how many it holds, and what it searches.
 * @returns Query options resolving to the page, which only run once both are known.
 */
export const organizationTeamMembersOptions = (
  orgId: number | undefined,
  teamId: number | undefined,
  page: OrganizationTeamRecordPage
) =>
  queryOptions({
    queryKey: organizationKeys.teamMembers(orgId, teamId, { ...page }),

    queryFn: () =>
      OrganizationService.getOrganizationTeamMembers(Number(orgId), Number(teamId), page),

    enabled: orgId !== undefined && teamId !== undefined,
    placeholderData: (previous) => previous,
  });

/**
 * Builds the query for one page of a team's projects.
 *
 * Each entry carries the project's id and the team's write access, so a row
 * reads the project behind it with `projectOptions`.
 *
 * @param orgId - The organization the team belongs to, absent until one is selected.
 * @param teamId - The team whose projects to read, absent while no team is open.
 * @param page - Where the page starts, how many it holds, and what it searches.
 * @returns Query options resolving to the page, which only run once both are known.
 */
export const organizationTeamProjectsOptions = (
  orgId: number | undefined,
  teamId: number | undefined,
  page: OrganizationTeamRecordPage
) =>
  queryOptions({
    queryKey: organizationKeys.teamProjects(orgId, teamId, { ...page }),

    queryFn: () =>
      OrganizationService.getOrganizationTeamProjects(Number(orgId), Number(teamId), page),

    enabled: orgId !== undefined && teamId !== undefined,
    placeholderData: (previous) => previous,
  });

/**
 * Builds the query for one page of a team's open invitations.
 *
 * @param orgId - The organization the team belongs to, absent until one is selected.
 * @param teamId - The team whose invitations to read, absent while no team is open.
 * @param page - Where the page starts, how many it holds, and what it searches.
 * @returns Query options resolving to the page, which only run once both are known.
 */
export const organizationTeamInvitationsOptions = (
  orgId: number | undefined,
  teamId: number | undefined,
  page: OrganizationTeamRecordPage
) =>
  queryOptions({
    queryKey: organizationKeys.teamInvitations(orgId, teamId, { ...page }),

    queryFn: () =>
      OrganizationService.getOrganizationTeamInvitations(Number(orgId), Number(teamId), page),

    enabled: orgId !== undefined && teamId !== undefined,
    placeholderData: (previous) => previous,
  });

/** What a page drawn on to add to a team asks for, and the team to leave out of it. */
export interface OrganizationCandidatePage {
  limit: number;
  offset: number;
  query?: string;
  excludeTeam?: number;
}

/**
 * Builds the query for one page of an organization's people.
 *
 * @param orgId - The organization whose people to read, absent until one is selected.
 * @param page - Where the page starts, how many it holds, what it searches, and the team to leave out.
 * @returns Query options resolving to the page, which only run once an organization is selected.
 */
export const organizationUsersOptions = (
  orgId: number | undefined,
  page: OrganizationCandidatePage
) =>
  queryOptions({
    queryKey: organizationKeys.users(orgId, { ...page }),
    queryFn: () => OrganizationService.getOrganizationUsers(Number(orgId), page),
    enabled: orgId !== undefined,
    placeholderData: (previous) => previous,
  });

/**
 * Builds the query for one page of an organization's projects.
 *
 * @param orgId - The organization whose projects to read, absent until one is selected.
 * @param page - Where the page starts, how many it holds, what it searches, and the team to leave out.
 * @returns Query options resolving to the page, which only run once an organization is selected.
 */
export const organizationProjectsOptions = (
  orgId: number | undefined,
  page: OrganizationCandidatePage
) =>
  queryOptions({
    queryKey: organizationKeys.projects(orgId, { ...page }),
    queryFn: () => OrganizationService.getOrganizationProjects(Number(orgId), page),
    enabled: orgId !== undefined,
    placeholderData: (previous) => previous,
  });

/**
 * Builds the query for which of the organization's AI features are switched on.
 *
 * Separate from the entitlements the organization carries: a feature can be
 * bought and left off, and this is the part a screen turns.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to each feature and whether it is on.
 */
export const organizationAiFeatureSettingsOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: organizationKeys.aiFeatures(orgId),
    queryFn: () => OrganizationService.getOrganizationAiFeatureSettings(Number(orgId)),
    enabled: orgId !== undefined,
  });

/**
 * Builds the query for which regulations an organization's reports carry.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the preferences.
 */
export const organizationPreferenceOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: organizationKeys.preference(orgId),
    queryFn: () => OrganizationService.getOrganizationPreference(Number(orgId)),
    enabled: orgId !== undefined,
  });

/**
 * Builds the query for whether single sign-on is on for an organization.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the setting.
 */
export const organizationSsoOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: organizationKeys.sso(orgId),
    queryFn: () => OrganizationService.getOrganizationSso(Number(orgId)),
    enabled: orgId !== undefined,
    retry: false,

    /*
      The refusal is the answer, so it is kept rather than asked again: a second reader of
      it would otherwise send the same refused request, and so would every later visit to
      the screen. What the screen changes here, it invalidates itself.
    */
    retryOnMount: false,
    staleTime: Infinity,
  });

/**
 * Builds the query for what Appknox was told about the identity provider.
 *
 * Answered with 404 where none is set up and 403 where the account may not see
 * it, so the failure is left to the caller rather than retried.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the provider's metadata.
 */
export const samlIdpMetadataOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: organizationKeys.samlIdpMetadata(orgId),
    queryFn: () => OrganizationService.getSamlIdpMetadata(Number(orgId)),
    enabled: orgId !== undefined,
    retry: false,

    /*
      The refusal is the answer, so it is kept rather than asked again: a second reader of
      it would otherwise send the same refused request, and so would every later visit to
      the screen. What the screen changes here, it invalidates itself.
    */
    retryOnMount: false,
    staleTime: Infinity,
  });

/**
 * Builds the query for what an identity provider needs to know about Appknox.
 *
 * The same for every organization, so it is held rather than read again.
 *
 * @returns Query options resolving to the fields and the XML document.
 */
export const samlSpMetadataOptions = () =>
  queryOptions({
    queryKey: organizationKeys.samlSpMetadata(),
    queryFn: () => OrganizationService.getSamlSpMetadata(),
    staleTime: Infinity,
  });

/**
 * Builds the query for the OpenID Connect provider an organization signs in through.
 *
 * Answered with 404 where none is set up, so the failure is left to the caller.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the provider.
 */
export const oidcProviderOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: organizationKeys.oidcProvider(orgId),
    queryFn: () => OrganizationService.getOidcProvider(Number(orgId)),
    enabled: orgId !== undefined,
    retry: false,

    /*
      The refusal is the answer, so it is kept rather than asked again: a second reader of
      it would otherwise send the same refused request, and so would every later visit to
      the screen. What the screen changes here, it invalidates itself.
    */
    retryOnMount: false,
    staleTime: Infinity,
  });

/**
 * Builds the query for the iOS signing certificates an organization holds.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the certificates.
 */
export const organizationSigningCertificatesOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: organizationKeys.signingCertificates(orgId),
    queryFn: () => OrganizationService.getOrganizationSigningCertificates(Number(orgId)),
    enabled: orgId !== undefined,
  });

/**
 * Builds the query for one page of the archive exports an organization has asked for.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @param page - Where the page starts and how many it holds.
 * @returns Query options resolving to the page.
 */
export const organizationArchivesOptions = (
  orgId: number | undefined,
  page: { limit: number; offset: number }
) =>
  queryOptions({
    queryKey: organizationKeys.archives(orgId, page),
    queryFn: () => OrganizationService.getOrganizationArchives(Number(orgId), page),
    enabled: orgId !== undefined,
    placeholderData: (previous) => previous,
  });

/**
 * Builds the query for whether old binaries are cleaned up.
 *
 * The endpoint answers 404 for an organization the feature is not set up for,
 * so the failure is left to the caller, which leaves the section out.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the preference.
 */
export const organizationCleanupPreferenceOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: organizationKeys.cleanupPreference(orgId),
    queryFn: () => OrganizationService.getOrganizationCleanupPreference(Number(orgId)),
    enabled: orgId !== undefined,
    retry: false,

    /*
      The refusal is the answer, so it is kept rather than asked again: a second reader of
      it would otherwise send the same refused request, and so would every later visit to
      the screen. What the screen changes here, it invalidates itself.
    */
    retryOnMount: false,
    staleTime: Infinity,
  });

/**
 * Builds the query for one page of the cleanups that have run.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @param page - Where the page starts and how many it holds.
 * @returns Query options resolving to the page.
 */
export const organizationCleanupsOptions = (
  orgId: number | undefined,
  page: { limit: number; offset: number }
) =>
  queryOptions({
    queryKey: organizationKeys.cleanups(orgId, page),
    queryFn: () => OrganizationService.getOrganizationCleanups(Number(orgId), page),
    enabled: orgId !== undefined,
    placeholderData: (previous) => previous,
  });

/**
 * Builds the query for the devices members have registered.
 *
 * The endpoint refuses with 400 where the organization allows registration but
 * has no device farm behind it, which the screen tells apart from having none
 * registered yet, so the failure is left to the caller rather than retried.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the devices.
 */
export const organizationRegisteredDevicesOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: organizationKeys.registeredDevices(orgId),
    queryFn: () => OrganizationService.getOrganizationRegisteredDevices(Number(orgId)),
    enabled: orgId !== undefined,
    retry: false,

    /*
      The refusal is the answer, so it is kept rather than asked again: a second reader of
      it would otherwise send the same refused request, and so would every later visit to
      the screen. What the screen changes here, it invalidates itself.
    */
    retryOnMount: false,
    staleTime: Infinity,
  });

/**
 * Builds the query for the email domains an organization restricts its accounts to.
 *
 * @param orgId - The organization to ask about, absent until one is selected.
 * @returns Query options resolving to the domains.
 */
export const organizationEmailDomainsOptions = (orgId: number | undefined) =>
  queryOptions({
    queryKey: organizationKeys.emailDomains(orgId),
    queryFn: () => OrganizationService.getOrganizationEmailDomains(Number(orgId)),
    enabled: orgId !== undefined,
  });

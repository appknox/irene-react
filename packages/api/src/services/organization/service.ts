import { apiRequest, REQUEST_ABORT_TIMEOUT_MS } from '@irene/api/request';
import { transformPaginatedResponse } from '@irene/api/utils/transforms';
import type { ApiPageEnvelope } from '@irene/api/utils/pagination';

import type {
  ApiOidcProvider,
  ApiOrganization,
  ApiOrganizationAiFeatureSettings,
  ApiOrganizationArchive,
  ApiOrganizationCleanup,
  ApiOrganizationCleanupPreference,
  ApiOrganizationEmailDomain,
  ApiOrganizationInvitation,
  ApiOrganizationMe,
  ApiOrganizationMembership,
  ApiOrganizationNamespace,
  ApiOrganizationPreference,
  ApiOrganizationProject,
  ApiOrganizationRegisteredDevice,
  ApiOrganizationSigningCertificate,
  ApiOrganizationSso,
  ApiOrganizationTeam,
  ApiOrganizationTeamMember,
  ApiOrganizationTeamProject,
  ApiOrganizationUser,
  ApiReportPreference,
  ApiSamlIdpMetadata,
  ApiSamlSpMetadata,
  ApiStoreknoxOrganization,
  OidcProviderRequest,
  OrganizationArchiveRequest,
  OrganizationSigningCertificateRequest,
} from '@irene/api/services/organization';

import { OrganizationEndpoints } from './endpoints';
import { ORGANIZATION_ARCHIVE_TYPE } from './types';

/** Talks to the endpoints describing the organization a signed-in account works in. */
export default class OrganizationService {
  /**
   * Fetches the organizations this account belongs to.
   * @returns The organizations, and the total count.
   */
  public static readonly getOrganizations = async () => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganization>>(
      OrganizationEndpoints.list(),
      { signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS) }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Fetches what this account may do within one organization.
   *
   * @param organizationId - The organization to ask about.
   * @returns The account's role and permissions there.
   */
  public static readonly getOrganizationMe = (organizationId: number | string) =>
    apiRequest.get<ApiOrganizationMe>(OrganizationEndpoints.me(organizationId), {
      signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS),
    });

  /**
   * Fetches one account's membership of an organization.
   *
   * @param organizationId - The organization the membership is in.
   * @param userId - The account whose membership to read.
   * @returns Their role, and when they joined and were last seen.
   */
  public static readonly getOrganizationMembership = (
    organizationId: number | string,
    userId: number | string
  ) =>
    apiRequest.get<ApiOrganizationMembership>(
      OrganizationEndpoints.member(organizationId, userId),
      { signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS) }
    );

  /**
   * Fetches the invitations an organization is still waiting on, a page at a time.
   *
   * Only the unanswered ones: an accepted invitation is a membership, and is
   * read from the members instead.
   *
   * @param organizationId - The organization whose invitations to read.
   * @param page.limit - How many to read.
   * @param page.offset - How many to skip.
   * @returns The page, with the count across every page.
   */
  public static readonly getOrganizationInvitations = async (
    organizationId: number | string,
    { limit, offset }: { limit: number; offset: number }
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganizationInvitation>>(
      OrganizationEndpoints.invitations(organizationId),
      { params: { limit, offset, is_accepted: false, q: '' } }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Sends an invitation again, for one that went unanswered.
   *
   * @param organizationId - The organization that sent it.
   * @param invitationId - The invitation to send again.
   */
  public static readonly resendOrganizationInvitation = (
    organizationId: number | string,
    invitationId: number | string
  ) => apiRequest.post(OrganizationEndpoints.resendInvitation(organizationId, invitationId), {});

  /**
   * Withdraws an invitation.
   *
   * @param organizationId - The organization that sent it.
   * @param invitationId - The invitation to withdraw.
   */
  public static readonly deleteOrganizationInvitation = (
    organizationId: number | string,
    invitationId: number | string
  ) => apiRequest.delete(OrganizationEndpoints.invitation(organizationId, invitationId));

  /**
   * Changes what a member may do in an organization.
   *
   * @param organizationId - The organization they belong to.
   * @param userId - The member whose role changes.
   * @param role - The role to give them.
   * @returns Their standing under the new role.
   */
  public static readonly setOrganizationMemberRole = (
    organizationId: number | string,
    userId: number | string,
    role: number
  ) =>
    apiRequest.put<ApiOrganizationMembership>(
      OrganizationEndpoints.member(organizationId, userId),
      { role }
    );

  /**
   * Starts a team within an organization.
   *
   * @param organizationId - The organization the team belongs to.
   * @param name - What to call it.
   * @returns The team as created.
   */
  public static readonly createOrganizationTeam = (organizationId: number | string, name: string) =>
    apiRequest.post<ApiOrganizationTeam>(OrganizationEndpoints.teams(organizationId), { name });

  /**
   * Invites one person into an organization.
   *
   * One address at a time, as irene sends them, so one refusal does not take
   * the rest of the invitations down with it.
   *
   * @param organizationId - The organization to invite them into.
   * @param email - Where to send the invitation.
   */
  public static readonly inviteToOrganization = (organizationId: number | string, email: string) =>
    apiRequest.post(OrganizationEndpoints.invitations(organizationId), { email });

  /**
   * Fetches an organization's teams, a page at a time.
   *
   * @param organizationId - The organization whose teams to read.
   * @param page.limit - How many to read.
   * @param page.offset - How many to skip.
   * @param page.query - What to search their names for.
   * @param page.includeUser - A member, to read the teams they are in alone.
   * @param page.excludeUser - A member, to read the teams they are not in, for adding them to one.
   * @returns The page, with the count across every page.
   */
  public static readonly getOrganizationTeams = async (
    organizationId: number | string,
    {
      limit,
      offset,
      query = '',
      includeUser,
      excludeUser,
    }: {
      limit: number;
      offset: number;
      query?: string;
      includeUser?: number | string;
      excludeUser?: number | string;
    }
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganizationTeam>>(
      OrganizationEndpoints.teams(organizationId),
      {
        params: {
          limit,
          offset,
          q: query,
          ...(includeUser === undefined ? {} : { include_user: includeUser }),
          ...(excludeUser === undefined ? {} : { exclude_user: excludeUser }),
        },
      }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Fetches one team, by the id another record refers to it by.
   *
   * @param organizationId - The organization the team belongs to.
   * @param teamId - The team to read.
   * @returns The team, name and counts.
   */
  public static readonly getOrganizationTeam = (
    organizationId: number | string,
    teamId: number | string
  ) => apiRequest.get<ApiOrganizationTeam>(OrganizationEndpoints.team(organizationId, teamId));

  /**
   * Fetches the people in one team, a page at a time.
   *
   * Each entry carries the member's id alone, so the name beside it is read
   * from the organization's users.
   *
   * @param organizationId - The organization the team belongs to.
   * @param teamId - The team whose members to read.
   * @param page.limit - How many to read.
   * @param page.offset - How many to skip.
   * @param page.query - What to search them for.
   * @returns The page, with the count across every page.
   */
  public static readonly getOrganizationTeamMembers = async (
    organizationId: number | string,
    teamId: number | string,
    { limit, offset, query = '' }: { limit: number; offset: number; query?: string }
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganizationTeamMember>>(
      OrganizationEndpoints.teamMembers(organizationId, teamId),
      { params: { limit, offset, q: query } }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Puts one person in a team.
   *
   * Without write access, as irene adds a member and leaves the access to be
   * granted per project.
   *
   * @param organizationId - The organization the team belongs to.
   * @param teamId - The team to add them to.
   * @param userId - The person to add.
   */
  public static readonly addOrganizationTeamMember = (
    organizationId: number | string,
    teamId: number | string,
    userId: number | string
  ) =>
    apiRequest.put<void>(OrganizationEndpoints.teamMember(organizationId, teamId, userId), {
      write: false,
    });

  /**
   * Takes one person out of a team.
   *
   * @param organizationId - The organization the team belongs to.
   * @param teamId - The team to remove them from.
   * @param userId - The person to remove.
   */
  public static readonly removeOrganizationTeamMember = (
    organizationId: number | string,
    teamId: number | string,
    userId: number | string
  ) => apiRequest.delete<void>(OrganizationEndpoints.teamMember(organizationId, teamId, userId));

  /**
   * Fetches the projects one team works on, a page at a time.
   *
   * Each entry carries the project's id and the team's write access, so the
   * package name beside it is read from the project itself.
   *
   * @param organizationId - The organization the team belongs to.
   * @param teamId - The team whose projects to read.
   * @param page.limit - How many to read.
   * @param page.offset - How many to skip.
   * @param page.query - What to search them for.
   * @returns The page, with the count across every page.
   */
  public static readonly getOrganizationTeamProjects = async (
    organizationId: number | string,
    teamId: number | string,
    { limit, offset, query = '' }: { limit: number; offset: number; query?: string }
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganizationTeamProject>>(
      OrganizationEndpoints.teamProjects(organizationId, teamId),
      { params: { limit, offset, q: query } }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Puts one project in a team, read-only.
   *
   * @param organizationId - The organization the team belongs to.
   * @param teamId - The team to add it to.
   * @param projectId - The project to add.
   */
  public static readonly addOrganizationTeamProject = (
    organizationId: number | string,
    teamId: number | string,
    projectId: number | string
  ) =>
    apiRequest.put<void>(OrganizationEndpoints.teamProject(organizationId, teamId, projectId), {
      write: false,
    });

  /**
   * Takes one project out of a team.
   *
   * @param organizationId - The organization the team belongs to.
   * @param teamId - The team to remove it from.
   * @param projectId - The project to remove.
   */
  public static readonly removeOrganizationTeamProject = (
    organizationId: number | string,
    teamId: number | string,
    projectId: number | string
  ) =>
    apiRequest.delete<void>(OrganizationEndpoints.teamProject(organizationId, teamId, projectId));

  /**
   * Sets whether a team may write to one of its projects.
   *
   * @param organizationId - The organization the team belongs to.
   * @param teamId - The team whose access to set.
   * @param projectId - The project the access is on.
   * @param write - Whether the team may write to it.
   */
  public static readonly setOrganizationTeamProjectWrite = (
    organizationId: number | string,
    teamId: number | string,
    projectId: number | string,
    write: boolean
  ) =>
    apiRequest.put<ApiOrganizationTeamProject>(
      OrganizationEndpoints.teamProject(organizationId, teamId, projectId),
      { write }
    );

  /**
   * Fetches the invitations one team has open, a page at a time.
   *
   * Accepted ones are left out, as they are no longer pending.
   *
   * @param organizationId - The organization the team belongs to.
   * @param teamId - The team whose invitations to read.
   * @param page.limit - How many to read.
   * @param page.offset - How many to skip.
   * @param page.query - What to search their addresses for.
   * @returns The page, with the count across every page.
   */
  public static readonly getOrganizationTeamInvitations = async (
    organizationId: number | string,
    teamId: number | string,
    { limit, offset, query = '' }: { limit: number; offset: number; query?: string }
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganizationInvitation>>(
      OrganizationEndpoints.teamInvitations(organizationId, teamId),
      { params: { limit, offset, is_accepted: false, q: query } }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Invites one person into a team.
   *
   * @param organizationId - The organization the team belongs to.
   * @param teamId - The team to invite them into.
   * @param email - Where to send the invitation.
   */
  public static readonly inviteToOrganizationTeam = (
    organizationId: number | string,
    teamId: number | string,
    email: string
  ) => apiRequest.post(OrganizationEndpoints.teamInvitations(organizationId, teamId), { email });

  /**
   * Renames a team.
   *
   * @param organizationId - The organization the team belongs to.
   * @param teamId - The team to rename.
   * @param name - What to call it.
   * @returns The team under its new name.
   */
  public static readonly renameOrganizationTeam = (
    organizationId: number | string,
    teamId: number | string,
    name: string
  ) =>
    apiRequest.put<ApiOrganizationTeam>(OrganizationEndpoints.team(organizationId, teamId), {
      name,
    });

  /**
   * Removes a team, with everyone and everything in it.
   *
   * @param organizationId - The organization the team belongs to.
   * @param teamId - The team to remove.
   */
  public static readonly deleteOrganizationTeam = (
    organizationId: number | string,
    teamId: number | string
  ) => apiRequest.delete<void>(OrganizationEndpoints.team(organizationId, teamId));

  /**
   * Fetches an organization's people, a page at a time.
   *
   * @param organizationId - The organization whose people to read.
   * @param page.limit - How many to read.
   * @param page.offset - How many to skip.
   * @param page.query - What to search their names for.
   * @param page.excludeTeam - A team whose members to leave out, for adding the rest to it.
   * @returns The page, with the count across every page.
   */
  public static readonly getOrganizationUsers = async (
    organizationId: number | string,
    {
      limit,
      offset,
      query = '',
      excludeTeam,
    }: { limit: number; offset: number; query?: string; excludeTeam?: number | string }
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganizationUser>>(
      OrganizationEndpoints.users(organizationId),
      {
        params: {
          limit,
          offset,
          q: query,
          ...(excludeTeam === undefined ? {} : { exclude_team: excludeTeam }),
        },
      }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Fetches an organization's projects, a page at a time.
   *
   * @param organizationId - The organization whose projects to read.
   * @param page.limit - How many to read.
   * @param page.offset - How many to skip.
   * @param page.query - What to search their package names for.
   * @param page.excludeTeam - A team whose projects to leave out, for adding the rest to it.
   * @returns The page, with the count across every page.
   */
  public static readonly getOrganizationProjects = async (
    organizationId: number | string,
    {
      limit,
      offset,
      query = '',
      excludeTeam,
    }: { limit: number; offset: number; query?: string; excludeTeam?: number | string }
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganizationProject>>(
      OrganizationEndpoints.projects(organizationId),
      {
        params: {
          limit,
          offset,
          q: query,
          ...(excludeTeam === undefined ? {} : { exclude_team: excludeTeam }),
        },
      }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Fetches the people in an organization, a page at a time.
   *
   * Deactivated members are left out unless asked for, as irene leaves them
   * out until the box beside the search is ticked.
   *
   * @param organizationId - The organization whose members to read.
   * @param page.limit - How many to read.
   * @param page.offset - How many to skip.
   * @param page.query - What to search their name and email for.
   * @param page.includeInactive - Whether to include deactivated members.
   * @returns The page, with the count across every page.
   */
  public static readonly getOrganizationMembers = async (
    organizationId: number | string,
    {
      limit,
      offset,
      query = '',
      includeInactive = false,
    }: { limit: number; offset: number; query?: string; includeInactive?: boolean }
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganizationMembership>>(
      OrganizationEndpoints.members(organizationId),
      { params: { limit, offset, q: query, ...(includeInactive ? {} : { is_active: true }) } }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Renames an organization.
   *
   * @param organizationId - The organization to rename.
   * @param name - What to call it.
   * @returns The organization under its new name.
   */
  public static readonly renameOrganization = (organizationId: number | string, name: string) =>
    apiRequest.put<ApiOrganization>(OrganizationEndpoints.detail(organizationId), { name });

  /**
   * Fetches one member of an organization, for the name to put beside a record
   * that carries only their id.
   *
   * @param organizationId - The organization they belong to.
   * @param userId - The member to read.
   * @returns The member, with the name they are known by.
   */
  public static readonly getOrganizationUser = (
    organizationId: number | string,
    userId: number | string
  ) => apiRequest.get<ApiOrganizationUser>(OrganizationEndpoints.user(organizationId, userId));

  /**
   * Activates or deactivates one member of an organization.
   *
   * A deactivated member keeps their place and their teams but cannot sign in,
   * which is how irene retires someone rather than removing them.
   *
   * @param organizationId - The organization they belong to.
   * @param userId - The member to activate or deactivate.
   * @param isActive - Whether they may sign in.
   * @returns The member, as they now stand.
   */
  public static readonly setOrganizationUserActive = (
    organizationId: number | string,
    userId: number | string,
    isActive: boolean
  ) =>
    apiRequest.put<ApiOrganizationUser>(OrganizationEndpoints.user(organizationId, userId), {
      is_active: isActive,
    });

  /**
   * Fetches the namespaces an organization has claimed, a page at a time.
   *
   * @param organizationId - The organization whose namespaces to read.
   * @param page.limit - How many to read.
   * @param page.offset - How many to skip.
   * @returns The page, with the count across every page.
   */
  public static readonly getOrganizationNamespaces = async (
    organizationId: number | string,
    { limit, offset }: { limit: number; offset: number }
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganizationNamespace>>(
      OrganizationEndpoints.namespaces(organizationId),
      { params: { limit, offset } }
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Fetches one namespace an organization has claimed.
   *
   * @param organizationId - The organization the namespace belongs to.
   * @param namespaceId - The namespace to read.
   * @returns The namespace; rejects when it has been rejected and removed.
   */
  public static readonly getOrganizationNamespace = (
    organizationId: number | string,
    namespaceId: number | string
  ) =>
    apiRequest.get<ApiOrganizationNamespace>(
      OrganizationEndpoints.namespace(organizationId, namespaceId)
    );

  /**
   * Approves a namespace, which lets uploads under it through.
   *
   * @param organizationId - The organization the namespace belongs to.
   * @param namespaceId - The namespace to approve.
   * @returns The approved namespace.
   */
  public static readonly approveOrganizationNamespace = (
    organizationId: number | string,
    namespaceId: number | string
  ) =>
    apiRequest.put<ApiOrganizationNamespace>(
      OrganizationEndpoints.namespace(organizationId, namespaceId),
      { is_approved: true }
    );

  /**
   * Rejects a namespace, which removes it.
   *
   * @param organizationId - The organization the namespace belongs to.
   * @param namespaceId - The namespace to reject.
   */
  public static readonly rejectOrganizationNamespace = (
    organizationId: number | string,
    namespaceId: number | string
  ) => apiRequest.delete<void>(OrganizationEndpoints.namespace(organizationId, namespaceId));

  /**
   * Fetches which of the organization's AI features are switched on.
   *
   * @param organizationId - The organization to ask about.
   * @returns Each feature, and whether it is on.
   */
  public static readonly getOrganizationAiFeatureSettings = (organizationId: number | string) =>
    apiRequest.get<ApiOrganizationAiFeatureSettings>(
      OrganizationEndpoints.aiFeatures(organizationId)
    );

  /**
   * Switches the organization's AI features on and off.
   *
   * Every feature is sent, not only the one that changed, as irene saves the
   * record whole.
   *
   * @param organizationId - The organization to set them for.
   * @param settings - Each feature, and whether it is to be on.
   * @returns The features, as they now stand.
   */
  public static readonly setOrganizationAiFeatureSettings = (
    organizationId: number | string,
    settings: ApiOrganizationAiFeatureSettings
  ) =>
    apiRequest.put<ApiOrganizationAiFeatureSettings>(
      OrganizationEndpoints.aiFeatures(organizationId),
      settings
    );

  /**
   * Fetches the StoreKnox organization an account belongs to.
   *
   * The endpoint lists them, and an account has at most one, so the first is
   * the one in use.
   *
   * @returns The StoreKnox organization, or null when the account is in none.
   */
  public static readonly getStoreknoxOrganization = async () => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiStoreknoxOrganization>>(
      OrganizationEndpoints.storeknoxOrganization(),
      { signal: AbortSignal.timeout(REQUEST_ABORT_TIMEOUT_MS) }
    );

    return transformPaginatedResponse(page).items[0] ?? null;
  };
  /**
   * Turns members' override requests on or off.
   *
   * @param organizationId - Whose feature to set.
   * @param isEnabled - Whether members may ask to override an analysis.
   */
  public static readonly setMemberOverrideRequestFeature = (
    organizationId: number | string,
    isEnabled: boolean
  ) =>
    apiRequest.patch(OrganizationEndpoints.memberOverrideRequestFeature(organizationId), {
      member_override_request: isEnabled,
    });

  /**
   * Makes the second factor mandatory for everyone in an organization, or optional again.
   *
   * @param organizationId - Whose mandate to set.
   * @param isMandatory - Whether every account must carry a second factor.
   * @returns The organization as it now stands.
   */
  public static readonly setMandatoryMfa = (
    organizationId: number | string,
    isMandatory: boolean
  ) =>
    apiRequest.put<ApiOrganization>(OrganizationEndpoints.detail(organizationId), {
      mandatory_mfa: isMandatory,
    });

  /**
   * Reads which regulations an organization's reports carry.
   *
   * @param organizationId - Whose preferences to read.
   * @returns The preferences.
   */
  public static readonly getOrganizationPreference = (organizationId: number | string) =>
    apiRequest.get<ApiOrganizationPreference>(OrganizationEndpoints.preference(organizationId));

  /**
   * Writes which regulations the reports carry.
   *
   * The endpoint takes the set whole rather than one regulation at a time, so a
   * caller sends what the others are alongside the one it changed.
   *
   * @param organizationId - Whose preferences to write.
   * @param reportPreference - Every regulation, and whether reports carry it.
   * @returns The preferences as they now stand.
   */
  public static readonly setOrganizationReportPreference = (
    organizationId: number | string,
    reportPreference: ApiReportPreference
  ) =>
    apiRequest.put<ApiOrganizationPreference>(OrganizationEndpoints.preference(organizationId), {
      report_preference: reportPreference,
    });

  /**
   * Turns device registration on or off for an organization.
   *
   * @param organizationId - Whose setting to change.
   * @param isEnabled - Whether members may register their own devices.
   * @returns The organization as it now stands.
   */
  public static readonly setCyodRegistrationEnabled = (
    organizationId: number | string,
    isEnabled: boolean
  ) =>
    apiRequest.put<ApiOrganization>(OrganizationEndpoints.detail(organizationId), {
      cyod_registration_enabled: isEnabled,
    });

  /**
   * Reads the devices members have registered with the organization.
   *
   * @param organizationId - Whose devices to read.
   * @returns The devices, with how many there are in all.
   */
  public static readonly getOrganizationRegisteredDevices = async (
    organizationId: number | string
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganizationRegisteredDevice>>(
      OrganizationEndpoints.registeredDevices(organizationId)
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Reads whether single sign-on is on for an organization.
   *
   * @param organizationId - Whose setting to read.
   * @returns The setting.
   */
  public static readonly getOrganizationSso = (organizationId: number | string) =>
    apiRequest.get<ApiOrganizationSso>(OrganizationEndpoints.sso(organizationId));

  /**
   * Writes it back, as the endpoint takes both flags together.
   *
   * @param organizationId - Whose setting to write.
   * @param sso - Whether it is on, and whether it is the only way in.
   * @returns The setting as it now stands.
   */
  public static readonly setOrganizationSso = (
    organizationId: number | string,
    sso: Pick<ApiOrganizationSso, 'enabled' | 'enforced'>
  ) => apiRequest.put<ApiOrganizationSso>(OrganizationEndpoints.sso(organizationId), sso);

  /**
   * Reads what Appknox was told about the identity provider.
   *
   * The endpoint answers 404 where none has been uploaded and 403 where this
   * account may not see it, neither of which is reported as a failure.
   *
   * @param organizationId - Whose provider to read.
   * @returns The provider's metadata.
   */
  public static readonly getSamlIdpMetadata = (organizationId: number | string) =>
    apiRequest.get<ApiSamlIdpMetadata>(OrganizationEndpoints.samlIdpMetadata(organizationId));

  /**
   * Uploads that metadata as an XML document.
   *
   * It goes up as a file under `filename`, which is how the endpoint takes it,
   * so this is the one request here that is multipart rather than JSON.
   *
   * @param organizationId - Whose provider to set.
   * @param xml - The document's text.
   * @returns The provider's metadata as it was read back.
   */
  public static readonly uploadSamlIdpMetadata = (organizationId: number | string, xml: string) => {
    const body = new FormData();

    body.append('filename', new Blob([xml], { type: 'text/xml' }));

    return apiRequest.post<ApiSamlIdpMetadata>(
      OrganizationEndpoints.samlIdpMetadata(organizationId),
      body
    );
  };

  /**
   * Removes it, which leaves the organization with no identity provider.
   *
   * @param organizationId - Whose provider to remove.
   */
  public static readonly deleteSamlIdpMetadata = (organizationId: number | string) =>
    apiRequest.delete(OrganizationEndpoints.samlIdpMetadata(organizationId));

  /**
   * Reads what an identity provider needs to know about Appknox.
   *
   * @returns The fields, and the same thing as an XML document.
   */
  public static readonly getSamlSpMetadata = () =>
    apiRequest.get<ApiSamlSpMetadata>(OrganizationEndpoints.samlSpMetadata());

  /**
   * Reads the OpenID Connect provider an organization signs in through.
   *
   * The endpoint answers 404 where none is set up, which is not a failure.
   *
   * @param organizationId - Whose provider to read.
   * @returns The provider.
   */
  public static readonly getOidcProvider = (organizationId: number | string) =>
    apiRequest.get<ApiOidcProvider>(OrganizationEndpoints.oidcProvider(organizationId));

  /**
   * Sets one up.
   *
   * @param organizationId - Which organization to set it up for.
   * @param provider - Its client, that client's secret, and where to discover it.
   * @returns The provider as it was stored.
   */
  public static readonly createOidcProvider = (
    organizationId: number | string,
    provider: OidcProviderRequest
  ) =>
    apiRequest.post<ApiOidcProvider>(OrganizationEndpoints.oidcProvider(organizationId), provider);

  /**
   * Removes it.
   *
   * @param organizationId - Whose provider to remove.
   */
  public static readonly deleteOidcProvider = (organizationId: number | string) =>
    apiRequest.delete(OrganizationEndpoints.oidcProvider(organizationId));

  /**
   * Reads the iOS signing certificates an organization holds.
   *
   * @param organizationId - Whose certificates to read.
   * @returns The certificates, with how many there are in all.
   */
  public static readonly getOrganizationSigningCertificates = async (
    organizationId: number | string
  ) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganizationSigningCertificate>>(
      OrganizationEndpoints.signingCertificates(organizationId)
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Adds one, with its signing material base64-encoded in the body.
   *
   * @param organizationId - Which organization to add it to.
   * @param certificate - The material, its password and what it is called.
   * @returns The certificate as it was stored.
   */
  public static readonly addOrganizationSigningCertificate = (
    organizationId: number | string,
    certificate: OrganizationSigningCertificateRequest
  ) =>
    apiRequest.post<ApiOrganizationSigningCertificate>(
      OrganizationEndpoints.signingCertificates(organizationId),
      certificate
    );

  /**
   * Makes one of them the certificate apps are re-signed with.
   *
   * Only one may be active, so whichever held it loses it; the list is read
   * again to pick that up.
   *
   * @param organizationId - Whose certificate to activate.
   * @param certificateId - The certificate to activate.
   * @returns The certificate as it now stands.
   */
  public static readonly activateOrganizationSigningCertificate = (
    organizationId: number | string,
    certificateId: number | string
  ) =>
    apiRequest.post<ApiOrganizationSigningCertificate>(
      OrganizationEndpoints.activateSigningCertificate(organizationId, certificateId),
      {}
    );

  /**
   * Removes one.
   *
   * The endpoint refuses the active one while others remain, which the screen
   * holds the control back for rather than letting it be asked.
   *
   * @param organizationId - Whose certificate to remove.
   * @param certificateId - The certificate to remove.
   */
  public static readonly deleteOrganizationSigningCertificate = (
    organizationId: number | string,
    certificateId: number | string
  ) => apiRequest.delete(OrganizationEndpoints.signingCertificate(organizationId, certificateId));

  /**
   * Reads the archive exports an organization has asked for, a page at a time.
   *
   * @param organizationId - Whose exports to read.
   * @param page - Where the page starts and how many it holds.
   * @returns The page of exports, with how many there are in all.
   */
  public static readonly getOrganizationArchives = async (
    organizationId: number | string,
    page: { limit: number; offset: number }
  ) => {
    const answered = await apiRequest.get<ApiPageEnvelope<ApiOrganizationArchive>>(
      OrganizationEndpoints.archives(organizationId),
      { params: page }
    );

    return transformPaginatedResponse(answered);
  };

  /**
   * Asks for an export of everything over a span of days.
   *
   * @param organizationId - Whose export to ask for.
   * @param span - The span it covers, either end of which may be left open.
   * @returns The export, which is built after it is asked for.
   */
  public static readonly createOrganizationArchive = (
    organizationId: number | string,
    span: OrganizationArchiveRequest
  ) =>
    apiRequest.post<ApiOrganizationArchive>(OrganizationEndpoints.archives(organizationId), {
      ...span,
      archive_type: ORGANIZATION_ARCHIVE_TYPE.comprehensive,
    });

  /**
   * Asks for an export of each project's latest scan, which has a path of its own.
   *
   * @param organizationId - Whose export to ask for.
   * @param span - The span it covers, either end of which may be left open.
   */
  public static readonly createLatestScanArchive = (
    organizationId: number | string,
    span: OrganizationArchiveRequest
  ) => apiRequest.post(OrganizationEndpoints.latestScanArchive(organizationId), span);

  /**
   * Reads where one export's file may be fetched from.
   *
   * @param organizationId - Whose export it is.
   * @param archiveId - The export to fetch.
   * @returns The link, which is answered afresh each time and does not last.
   */
  public static readonly getOrganizationArchiveDownloadUrl = async (
    organizationId: number | string,
    archiveId: number | string
  ) => {
    const answered = await apiRequest.get<{ url: string }>(
      OrganizationEndpoints.archiveDownloadUrl(organizationId, archiveId)
    );

    return answered.url;
  };

  /**
   * Reads whether old binaries are cleaned up, and how many are kept.
   *
   * @param organizationId - Whose preference to read.
   * @returns The preference.
   */
  public static readonly getOrganizationCleanupPreference = (organizationId: number | string) =>
    apiRequest.get<ApiOrganizationCleanupPreference>(
      OrganizationEndpoints.cleanupPreference(organizationId)
    );

  /**
   * Writes that preference back whole, as the endpoint takes it.
   *
   * @param organizationId - Whose preference to write.
   * @param preference - The preference as it is to stand.
   * @returns The preference as it now stands.
   */
  public static readonly setOrganizationCleanupPreference = (
    organizationId: number | string,
    preference: Pick<ApiOrganizationCleanupPreference, 'is_enabled' | 'files_to_keep'>
  ) =>
    apiRequest.put<ApiOrganizationCleanupPreference>(
      OrganizationEndpoints.cleanupPreference(organizationId),
      preference
    );

  /**
   * Reads the cleanups that have run, a page at a time.
   *
   * @param organizationId - Whose cleanups to read.
   * @param page - Where the page starts and how many it holds.
   * @returns The page of cleanups, with how many there are in all.
   */
  public static readonly getOrganizationCleanups = async (
    organizationId: number | string,
    page: { limit: number; offset: number }
  ) => {
    const answered = await apiRequest.get<ApiPageEnvelope<ApiOrganizationCleanup>>(
      OrganizationEndpoints.cleanups(organizationId),
      { params: page }
    );

    return transformPaginatedResponse(answered);
  };

  /**
   * Starts a cleanup by hand.
   *
   * @param organizationId - Whose cleanup to start.
   * @returns The cleanup that was started.
   */
  public static readonly startOrganizationCleanup = (organizationId: number | string) =>
    apiRequest.post<ApiOrganizationCleanup>(OrganizationEndpoints.cleanups(organizationId), {});

  /**
   * Reads the email domains an organization restricts its accounts to.
   *
   * @param organizationId - Whose domains to read.
   * @returns The domains, in the order the endpoint holds them.
   */
  public static readonly getOrganizationEmailDomains = async (organizationId: number | string) => {
    const page = await apiRequest.get<ApiPageEnvelope<ApiOrganizationEmailDomain>>(
      OrganizationEndpoints.emailDomains(organizationId)
    );

    return transformPaginatedResponse(page);
  };

  /**
   * Adds an email domain.
   *
   * @param organizationId - Which organization to add it to.
   * @param domainName - The domain, such as example.com.
   * @returns The domain as it was recorded.
   */
  public static readonly addOrganizationEmailDomain = (
    organizationId: number | string,
    domainName: string
  ) =>
    apiRequest.post<ApiOrganizationEmailDomain>(
      OrganizationEndpoints.emailDomains(organizationId),
      { domain_name: domainName }
    );

  /**
   * Removes an email domain.
   *
   * @param organizationId - Which organization to remove it from.
   * @param domainId - The domain to remove.
   */
  public static readonly deleteOrganizationEmailDomain = (
    organizationId: number | string,
    domainId: number | string
  ) => apiRequest.delete(OrganizationEndpoints.emailDomain(organizationId, domainId));
}

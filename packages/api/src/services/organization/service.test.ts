import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { HTTP_STATUS_CODES } from '@irene/constants';

import {
  buildOrganization,
  buildOrganizationInvitation,
  buildOrganizationMe,
  buildOrganizationMembership,
  buildOrganizationNamespace,
  buildOrganizationProject,
  buildOrganizationTeam,
  buildOrganizationTeamMember,
  buildOrganizationTeamProject,
  buildOrganizationUser,
  buildStoreknoxOrganization,
} from '@tests/factories';

import { OrganizationEndpoints, OrganizationService } from '@irene/api/services/organization';
import { getApiErrorStatus } from '@irene/api/utils/errors';
import { buildAPITestURL, server } from '@tests/server';
import { buildDrfPage, recordRequestConfigs } from '@tests/utils';

const ORGANIZATION_ID = 42;
const USER_ID = 7;

describe('OrganizationService.getOrganizations', () => {
  it('returns the results as items with a count', async () => {
    const organization = buildOrganization({ name: 'Acme' });

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.list()), () =>
        HttpResponse.json(buildDrfPage([organization]))
      )
    );

    await expect(OrganizationService.getOrganizations()).resolves.toMatchObject({
      items: [organization],
      count: 1,
    });
  });

  it('returns an empty items list when the account belongs to none', async () => {
    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.list()), () =>
        HttpResponse.json(buildDrfPage([]))
      )
    );

    await expect(OrganizationService.getOrganizations()).resolves.toMatchObject({
      items: [],
      count: 0,
    });
  });
});

describe('OrganizationService.getOrganizationMe', () => {
  it('gets the me endpoint for the organization id it was given', async () => {
    let asked = '';

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.me(ORGANIZATION_ID)), ({ request }) => {
        asked = new URL(request.url).pathname;

        return HttpResponse.json(buildOrganizationMe());
      })
    );

    await OrganizationService.getOrganizationMe(ORGANIZATION_ID);

    expect(asked).toContain(`/organizations/${ORGANIZATION_ID}/me`);
  });

  it('returns is_admin, is_owner and has_security_permission', async () => {
    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.me(ORGANIZATION_ID)), () =>
        HttpResponse.json(buildOrganizationMe({ has_security_permission: true, is_admin: true }))
      )
    );

    await expect(OrganizationService.getOrganizationMe(ORGANIZATION_ID)).resolves.toMatchObject({
      has_security_permission: true,
      is_admin: true,
    });
  });
});

describe('OrganizationService.getOrganizationMembership', () => {
  it('returns the role, join date and last login', async () => {
    const membership = buildOrganizationMembership({ role_display: 'Owner' });

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.member(ORGANIZATION_ID, USER_ID)), () =>
        HttpResponse.json(membership)
      )
    );

    await expect(
      OrganizationService.getOrganizationMembership(ORGANIZATION_ID, USER_ID)
    ).resolves.toEqual(membership);
  });

  it('gets the member endpoint for the organization and user ids it was given', () => {
    expect(OrganizationEndpoints.member(7, 42)).toBe('api/organizations/7/members/42');
  });
});

describe('OrganizationService.getStoreknoxOrganization', () => {
  it('returns the first organization the list holds, which is the one in use', async () => {
    const storeknox = buildStoreknoxOrganization();

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.storeknoxOrganization()), () =>
        HttpResponse.json({ count: 1, next: null, previous: null, results: [storeknox] })
      )
    );

    await expect(OrganizationService.getStoreknoxOrganization()).resolves.toEqual(storeknox);
  });

  it('returns nothing when the account is in no StoreKnox organization', async () => {
    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.storeknoxOrganization()), () =>
        HttpResponse.json({ count: 0, next: null, previous: null, results: [] })
      )
    );

    await expect(OrganizationService.getStoreknoxOrganization()).resolves.toBeNull();
  });

  it('rejects when the deployment has no StoreKnox organization', async () => {
    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.storeknoxOrganization()), () =>
        HttpResponse.json({}, { status: HTTP_STATUS_CODES.NOT_FOUND })
      )
    );

    const error = await OrganizationService.getStoreknoxOrganization().catch(
      (reason: unknown) => reason
    );

    expect(getApiErrorStatus(error)).toBe(HTTP_STATUS_CODES.NOT_FOUND);
  });
});

describe('the timeout on the organization setup', () => {
  it('abandons the request after 30 seconds, so a hung server does not hold the page', async () => {
    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.list()), () =>
        HttpResponse.json(buildDrfPage([]))
      )
    );

    const recorder = recordRequestConfigs();

    await OrganizationService.getOrganizations().catch(() => undefined);
    recorder.stop();

    // The wait rides on a signal rather than axios's own `timeout`, which an
    // intercepted request never honours.
    expect(recorder.latest()?.signal).toBeInstanceOf(AbortSignal);
    expect(recorder.latest()?.signal?.aborted).toBe(false);
  });
});

describe('OrganizationService.getOrganizationNamespaces', () => {
  const namespacesUrl = buildAPITestURL(OrganizationEndpoints.namespaces(ORGANIZATION_ID));

  it('returns the page as items with the count across every page', async () => {
    const namespace = buildOrganizationNamespace({ value: 'com.example.app' });

    server.use(
      http.get(namespacesUrl, () => HttpResponse.json(buildDrfPage([namespace], { count: 12 })))
    );

    await expect(
      OrganizationService.getOrganizationNamespaces(ORGANIZATION_ID, { limit: 10, offset: 0 })
    ).resolves.toMatchObject({ items: [namespace], count: 12 });
  });

  it('asks for the page it is given', async () => {
    const recorded = recordRequestConfigs();

    server.use(http.get(namespacesUrl, () => HttpResponse.json(buildDrfPage([]))));

    await OrganizationService.getOrganizationNamespaces(ORGANIZATION_ID, { limit: 25, offset: 50 });

    expect(recorded.latest()?.params).toMatchObject({ limit: 25, offset: 50 });

    recorded.stop();
  });

  it('returns no items for an organization that has claimed none', async () => {
    server.use(http.get(namespacesUrl, () => HttpResponse.json(buildDrfPage([]))));

    await expect(
      OrganizationService.getOrganizationNamespaces(ORGANIZATION_ID, { limit: 10, offset: 0 })
    ).resolves.toMatchObject({ items: [], count: 0 });
  });
});

describe('OrganizationService.getOrganizationMembers', () => {
  const membersUrl = buildAPITestURL(OrganizationEndpoints.members(ORGANIZATION_ID));

  it('returns the page as items with the count across every page', async () => {
    const membership = buildOrganizationMembership({ role_display: 'Admin' });

    server.use(
      http.get(membersUrl, () => HttpResponse.json(buildDrfPage([membership], { count: 8 })))
    );

    await expect(
      OrganizationService.getOrganizationMembers(ORGANIZATION_ID, { limit: 10, offset: 0 })
    ).resolves.toMatchObject({ items: [membership], count: 8 });
  });

  it('leaves deactivated members out unless they are asked for', async () => {
    const recorded = recordRequestConfigs();

    server.use(http.get(membersUrl, () => HttpResponse.json(buildDrfPage([]))));

    await OrganizationService.getOrganizationMembers(ORGANIZATION_ID, { limit: 10, offset: 0 });

    expect(recorded.latest()?.params).toMatchObject({ is_active: true });

    recorded.stop();
  });

  it('includes them when they are', async () => {
    const recorded = recordRequestConfigs();

    server.use(http.get(membersUrl, () => HttpResponse.json(buildDrfPage([]))));

    await OrganizationService.getOrganizationMembers(ORGANIZATION_ID, {
      limit: 10,
      offset: 0,
      includeInactive: true,
    });

    expect(recorded.latest()?.params).not.toHaveProperty('is_active');

    recorded.stop();
  });

  it('passes the search on to the server', async () => {
    const recorded = recordRequestConfigs();

    server.use(http.get(membersUrl, () => HttpResponse.json(buildDrfPage([]))));

    await OrganizationService.getOrganizationMembers(ORGANIZATION_ID, {
      limit: 10,
      offset: 0,
      query: 'alice',
    });

    expect(recorded.latest()?.params).toMatchObject({ q: 'alice' });

    recorded.stop();
  });
});

describe('OrganizationService.getOrganizationTeams', () => {
  const teamsUrl = buildAPITestURL(OrganizationEndpoints.teams(ORGANIZATION_ID));

  it('returns the page as items with the count across every page', async () => {
    const team = buildOrganizationTeam({ name: 'Platform' });

    server.use(http.get(teamsUrl, () => HttpResponse.json(buildDrfPage([team], { count: 3 }))));

    await expect(
      OrganizationService.getOrganizationTeams(ORGANIZATION_ID, { limit: 10, offset: 0 })
    ).resolves.toMatchObject({ items: [team], count: 3 });
  });

  it('passes the search on to the server', async () => {
    const recorded = recordRequestConfigs();

    server.use(http.get(teamsUrl, () => HttpResponse.json(buildDrfPage([]))));

    await OrganizationService.getOrganizationTeams(ORGANIZATION_ID, {
      limit: 10,
      offset: 0,
      query: 'platform',
    });

    expect(recorded.latest()?.params).toMatchObject({ q: 'platform' });

    recorded.stop();
  });
});

describe('OrganizationService.getOrganizationUser', () => {
  it('returns the member behind an id', async () => {
    const user = buildOrganizationUser({ username: 'alice' });

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.user(ORGANIZATION_ID, USER_ID)), () =>
        HttpResponse.json(user)
      )
    );

    await expect(
      OrganizationService.getOrganizationUser(ORGANIZATION_ID, USER_ID)
    ).resolves.toEqual(user);
  });
});

describe('OrganizationService.renameOrganization', () => {
  it('returns the organization under its new name', async () => {
    const organization = buildOrganization({ name: 'Acme Renamed' });

    server.use(
      http.put(buildAPITestURL(OrganizationEndpoints.detail(ORGANIZATION_ID)), () =>
        HttpResponse.json(organization)
      )
    );

    await expect(
      OrganizationService.renameOrganization(ORGANIZATION_ID, 'Acme Renamed')
    ).resolves.toMatchObject({ name: 'Acme Renamed' });
  });
});

describe('OrganizationService.createOrganizationTeam', () => {
  it('returns the team as created', async () => {
    const team = buildOrganizationTeam({ name: 'Platform' });

    server.use(
      http.post(buildAPITestURL(OrganizationEndpoints.teams(ORGANIZATION_ID)), () =>
        HttpResponse.json(team)
      )
    );

    await expect(
      OrganizationService.createOrganizationTeam(ORGANIZATION_ID, 'Platform')
    ).resolves.toMatchObject({ name: 'Platform' });
  });
});

describe('OrganizationService.inviteToOrganization', () => {
  it('sends the address it is given', async () => {
    let invited: string | undefined;

    server.use(
      http.post(
        buildAPITestURL(OrganizationEndpoints.invitations(ORGANIZATION_ID)),
        async ({ request }) => {
          invited = ((await request.json()) as { email: string }).email;

          return HttpResponse.json({});
        }
      )
    );

    await OrganizationService.inviteToOrganization(ORGANIZATION_ID, 'a@b.test');

    expect(invited).toBe('a@b.test');
  });
});

describe('OrganizationService.setOrganizationMemberRole', () => {
  it('sends the role it is given', async () => {
    let sentRole: number | undefined;

    server.use(
      http.put(
        buildAPITestURL(OrganizationEndpoints.member(ORGANIZATION_ID, USER_ID)),
        async ({ request }) => {
          sentRole = ((await request.json()) as { role: number }).role;

          return HttpResponse.json(buildOrganizationMembership({ role: 2 }));
        }
      )
    );

    await OrganizationService.setOrganizationMemberRole(ORGANIZATION_ID, USER_ID, 2);

    expect(sentRole).toBe(2);
  });
});

describe('OrganizationService.getOrganizationInvitations', () => {
  it('returns the page as items with the count across every page', async () => {
    const invitation = buildOrganizationInvitation({ email: 'new@example.test' });

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.invitations(ORGANIZATION_ID)), () =>
        HttpResponse.json(buildDrfPage([invitation], { count: 4 }))
      )
    );

    await expect(
      OrganizationService.getOrganizationInvitations(ORGANIZATION_ID, { limit: 10, offset: 0 })
    ).resolves.toMatchObject({ items: [invitation], count: 4 });
  });

  it('asks only for the invitations still unanswered', async () => {
    let params: URLSearchParams | undefined;

    server.use(
      http.get(
        buildAPITestURL(OrganizationEndpoints.invitations(ORGANIZATION_ID)),
        ({ request }) => {
          params = new URL(request.url).searchParams;

          return HttpResponse.json(buildDrfPage([], { count: 0 }));
        }
      )
    );

    await OrganizationService.getOrganizationInvitations(ORGANIZATION_ID, { limit: 10, offset: 0 });

    expect(params?.get('is_accepted')).toBe('false');
  });
});

describe('OrganizationService.getOrganizationTeam', () => {
  it('returns the team the given id names', async () => {
    const team = buildOrganizationTeam({ id: 7, name: 'Platform' });

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.team(ORGANIZATION_ID, 7)), () =>
        HttpResponse.json(team)
      )
    );

    await expect(OrganizationService.getOrganizationTeam(ORGANIZATION_ID, 7)).resolves.toEqual(
      team
    );
  });
});

describe('OrganizationService.resendOrganizationInvitation', () => {
  it('asks the server to send it again', async () => {
    let resent = false;

    server.use(
      http.post(buildAPITestURL(OrganizationEndpoints.resendInvitation(ORGANIZATION_ID, 7)), () => {
        resent = true;

        return HttpResponse.json({});
      })
    );

    await OrganizationService.resendOrganizationInvitation(ORGANIZATION_ID, 7);

    expect(resent).toBe(true);
  });
});

describe('OrganizationService.deleteOrganizationInvitation', () => {
  it('withdraws it', async () => {
    let withdrawn = false;

    server.use(
      http.delete(buildAPITestURL(OrganizationEndpoints.invitation(ORGANIZATION_ID, 7)), () => {
        withdrawn = true;

        return HttpResponse.json({});
      })
    );

    await OrganizationService.deleteOrganizationInvitation(ORGANIZATION_ID, 7);

    expect(withdrawn).toBe(true);
  });
});

const TEAM_ID = 13;
const PROJECT_ID = 99;

describe('OrganizationService team members', () => {
  it('reads one page of a team’s members, searching for what it was given', async () => {
    const member = buildOrganizationTeamMember();
    let asked = new URLSearchParams();

    server.use(
      http.get(
        buildAPITestURL(OrganizationEndpoints.teamMembers(ORGANIZATION_ID, TEAM_ID)),
        ({ request }) => {
          asked = new URL(request.url).searchParams;

          return HttpResponse.json(buildDrfPage([member]));
        }
      )
    );

    await expect(
      OrganizationService.getOrganizationTeamMembers(ORGANIZATION_ID, TEAM_ID, {
        limit: 5,
        offset: 10,
        query: 'ali',
      })
    ).resolves.toMatchObject({ items: [member], count: 1 });

    expect(asked.get('limit')).toBe('5');
    expect(asked.get('offset')).toBe('10');
    expect(asked.get('q')).toBe('ali');
  });

  it('adds one without write access, as a member is added and granted access per project', async () => {
    const record = recordRequestConfigs();

    server.use(
      http.put(
        buildAPITestURL(OrganizationEndpoints.teamMember(ORGANIZATION_ID, TEAM_ID, USER_ID)),
        () => HttpResponse.json({})
      )
    );

    await OrganizationService.addOrganizationTeamMember(ORGANIZATION_ID, TEAM_ID, USER_ID);
    record.stop();

    expect(JSON.parse(String(record.latest()?.data))).toMatchObject({ write: false });
  });

  it('takes one out of the team', async () => {
    let removed = false;

    server.use(
      http.delete(
        buildAPITestURL(OrganizationEndpoints.teamMember(ORGANIZATION_ID, TEAM_ID, USER_ID)),
        () => {
          removed = true;

          return HttpResponse.json({});
        }
      )
    );

    await OrganizationService.removeOrganizationTeamMember(ORGANIZATION_ID, TEAM_ID, USER_ID);

    expect(removed).toBe(true);
  });
});

describe('OrganizationService team projects', () => {
  it('reads one page of a team’s projects', async () => {
    const project = buildOrganizationTeamProject({ write: true });

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.teamProjects(ORGANIZATION_ID, TEAM_ID)), () =>
        HttpResponse.json(buildDrfPage([project]))
      )
    );

    await expect(
      OrganizationService.getOrganizationTeamProjects(ORGANIZATION_ID, TEAM_ID, {
        limit: 5,
        offset: 0,
      })
    ).resolves.toMatchObject({ items: [project], count: 1 });
  });

  it('adds one read-only', async () => {
    const record = recordRequestConfigs();

    server.use(
      http.put(
        buildAPITestURL(OrganizationEndpoints.teamProject(ORGANIZATION_ID, TEAM_ID, PROJECT_ID)),
        () => HttpResponse.json({})
      )
    );

    await OrganizationService.addOrganizationTeamProject(ORGANIZATION_ID, TEAM_ID, PROJECT_ID);
    record.stop();

    expect(JSON.parse(String(record.latest()?.data))).toMatchObject({ write: false });
  });

  it('sets whether the team may write to one', async () => {
    const record = recordRequestConfigs();

    server.use(
      http.put(
        buildAPITestURL(OrganizationEndpoints.teamProject(ORGANIZATION_ID, TEAM_ID, PROJECT_ID)),
        () => HttpResponse.json(buildOrganizationTeamProject({ write: true }))
      )
    );

    await OrganizationService.setOrganizationTeamProjectWrite(
      ORGANIZATION_ID,
      TEAM_ID,
      PROJECT_ID,
      true
    );

    record.stop();

    expect(JSON.parse(String(record.latest()?.data))).toMatchObject({ write: true });
  });

  it('takes one out of the team', async () => {
    let removed = false;

    server.use(
      http.delete(
        buildAPITestURL(OrganizationEndpoints.teamProject(ORGANIZATION_ID, TEAM_ID, PROJECT_ID)),
        () => {
          removed = true;

          return HttpResponse.json({});
        }
      )
    );

    await OrganizationService.removeOrganizationTeamProject(ORGANIZATION_ID, TEAM_ID, PROJECT_ID);

    expect(removed).toBe(true);
  });
});

describe('OrganizationService team invitations', () => {
  it('leaves out the accepted ones, which are no longer pending', async () => {
    const invitation = buildOrganizationInvitation({ team: TEAM_ID });
    let asked = new URLSearchParams();

    server.use(
      http.get(
        buildAPITestURL(OrganizationEndpoints.teamInvitations(ORGANIZATION_ID, TEAM_ID)),
        ({ request }) => {
          asked = new URL(request.url).searchParams;

          return HttpResponse.json(buildDrfPage([invitation]));
        }
      )
    );

    await expect(
      OrganizationService.getOrganizationTeamInvitations(ORGANIZATION_ID, TEAM_ID, {
        limit: 5,
        offset: 0,
      })
    ).resolves.toMatchObject({ items: [invitation], count: 1 });

    expect(asked.get('is_accepted')).toBe('false');
  });

  it('sends one to the address it was given', async () => {
    const record = recordRequestConfigs();

    server.use(
      http.post(
        buildAPITestURL(OrganizationEndpoints.teamInvitations(ORGANIZATION_ID, TEAM_ID)),
        () => HttpResponse.json({})
      )
    );

    await OrganizationService.inviteToOrganizationTeam(
      ORGANIZATION_ID,
      TEAM_ID,
      'ali@example.test'
    );

    record.stop();

    expect(JSON.parse(String(record.latest()?.data))).toMatchObject({ email: 'ali@example.test' });
  });
});

describe('OrganizationService team itself', () => {
  it('renames it', async () => {
    const record = recordRequestConfigs();

    server.use(
      http.put(buildAPITestURL(OrganizationEndpoints.team(ORGANIZATION_ID, TEAM_ID)), () =>
        HttpResponse.json(buildOrganizationTeam({ name: 'Platform' }))
      )
    );

    await expect(
      OrganizationService.renameOrganizationTeam(ORGANIZATION_ID, TEAM_ID, 'Platform')
    ).resolves.toMatchObject({ name: 'Platform' });

    record.stop();

    expect(JSON.parse(String(record.latest()?.data))).toMatchObject({ name: 'Platform' });
  });

  it('removes it', async () => {
    let removed = false;

    server.use(
      http.delete(buildAPITestURL(OrganizationEndpoints.team(ORGANIZATION_ID, TEAM_ID)), () => {
        removed = true;

        return HttpResponse.json({});
      })
    );

    await OrganizationService.deleteOrganizationTeam(ORGANIZATION_ID, TEAM_ID);

    expect(removed).toBe(true);
  });
});

describe('OrganizationService candidates for a team', () => {
  it('leaves out the people already in the team', async () => {
    const user = buildOrganizationUser();
    let asked = new URLSearchParams();

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.users(ORGANIZATION_ID)), ({ request }) => {
        asked = new URL(request.url).searchParams;

        return HttpResponse.json(buildDrfPage([user]));
      })
    );

    await expect(
      OrganizationService.getOrganizationUsers(ORGANIZATION_ID, {
        limit: 10,
        offset: 0,
        excludeTeam: TEAM_ID,
      })
    ).resolves.toMatchObject({ items: [user], count: 1 });

    expect(asked.get('exclude_team')).toBe(String(TEAM_ID));
  });

  it('asks for everyone where no team is to be left out', async () => {
    let asked = new URLSearchParams();

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.users(ORGANIZATION_ID)), ({ request }) => {
        asked = new URL(request.url).searchParams;

        return HttpResponse.json(buildDrfPage([]));
      })
    );

    await OrganizationService.getOrganizationUsers(ORGANIZATION_ID, { limit: 10, offset: 0 });

    expect(asked.has('exclude_team')).toBe(false);
  });

  it('leaves out the projects already in the team', async () => {
    const project = buildOrganizationProject();
    let asked = new URLSearchParams();

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.projects(ORGANIZATION_ID)), ({ request }) => {
        asked = new URL(request.url).searchParams;

        return HttpResponse.json(buildDrfPage([project]));
      })
    );

    await expect(
      OrganizationService.getOrganizationProjects(ORGANIZATION_ID, {
        limit: 10,
        offset: 0,
        query: 'com.example',
        excludeTeam: TEAM_ID,
      })
    ).resolves.toMatchObject({ items: [project], count: 1 });

    expect(asked.get('exclude_team')).toBe(String(TEAM_ID));
    expect(asked.get('q')).toBe('com.example');
  });

  it('asks for every project where no team is to be left out', async () => {
    let asked = new URLSearchParams();

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.projects(ORGANIZATION_ID)), ({ request }) => {
        asked = new URL(request.url).searchParams;

        return HttpResponse.json(buildDrfPage([]));
      })
    );

    await OrganizationService.getOrganizationProjects(ORGANIZATION_ID, { limit: 10, offset: 0 });

    expect(asked.has('exclude_team')).toBe(false);
  });
});

describe('OrganizationService teams beside one member', () => {
  it('reads the teams a member is in', async () => {
    const team = buildOrganizationTeam();
    let asked = new URLSearchParams();

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.teams(ORGANIZATION_ID)), ({ request }) => {
        asked = new URL(request.url).searchParams;

        return HttpResponse.json(buildDrfPage([team]));
      })
    );

    await expect(
      OrganizationService.getOrganizationTeams(ORGANIZATION_ID, {
        limit: 5,
        offset: 0,
        includeUser: USER_ID,
      })
    ).resolves.toMatchObject({ items: [team], count: 1 });

    expect(asked.get('include_user')).toBe(String(USER_ID));
    expect(asked.has('exclude_user')).toBe(false);
  });

  it('reads the teams a member is not in, for putting them in one', async () => {
    let asked = new URLSearchParams();

    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.teams(ORGANIZATION_ID)), ({ request }) => {
        asked = new URL(request.url).searchParams;

        return HttpResponse.json(buildDrfPage([]));
      })
    );

    await OrganizationService.getOrganizationTeams(ORGANIZATION_ID, {
      limit: 5,
      offset: 0,
      excludeUser: USER_ID,
    });

    expect(asked.get('exclude_user')).toBe(String(USER_ID));
    expect(asked.has('include_user')).toBe(false);
  });
});

describe('OrganizationService.setOrganizationUserActive', () => {
  it('deactivates a member without removing them', async () => {
    const record = recordRequestConfigs();

    server.use(
      http.put(buildAPITestURL(OrganizationEndpoints.user(ORGANIZATION_ID, USER_ID)), () =>
        HttpResponse.json(buildOrganizationUser({ is_active: false }))
      )
    );

    await expect(
      OrganizationService.setOrganizationUserActive(ORGANIZATION_ID, USER_ID, false)
    ).resolves.toMatchObject({ is_active: false });

    record.stop();

    expect(JSON.parse(String(record.latest()?.data))).toMatchObject({ is_active: false });
  });

  it('brings a deactivated member back', async () => {
    const record = recordRequestConfigs();

    server.use(
      http.put(buildAPITestURL(OrganizationEndpoints.user(ORGANIZATION_ID, USER_ID)), () =>
        HttpResponse.json(buildOrganizationUser({ is_active: true }))
      )
    );

    await OrganizationService.setOrganizationUserActive(ORGANIZATION_ID, USER_ID, true);
    record.stop();

    expect(JSON.parse(String(record.latest()?.data))).toMatchObject({ is_active: true });
  });
});

describe('OrganizationService.setMemberOverrideRequestFeature', () => {
  it('sends whether members may ask to override an analysis', async () => {
    let sent: unknown = null;

    server.use(
      http.patch(
        buildAPITestURL(OrganizationEndpoints.memberOverrideRequestFeature(ORGANIZATION_ID)),
        async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;

          sent = body;

          return HttpResponse.json(body);
        }
      )
    );

    await OrganizationService.setMemberOverrideRequestFeature(ORGANIZATION_ID, true);

    expect(sent).toStrictEqual({ member_override_request: true });
  });
});

describe('OrganizationService.setMandatoryMfa', () => {
  it('sends the mandate and returns the organization as it now stands', async () => {
    const organization = buildOrganization({ name: 'Acme' });

    organization.mandatory_mfa = true;

    server.use(
      http.put(
        buildAPITestURL(OrganizationEndpoints.detail(ORGANIZATION_ID)),
        async ({ request }) => {
          expect(await request.json()).toStrictEqual({ mandatory_mfa: true });

          return HttpResponse.json(organization);
        }
      )
    );

    await expect(OrganizationService.setMandatoryMfa(ORGANIZATION_ID, true)).resolves.toMatchObject(
      { mandatory_mfa: true }
    );
  });
});

describe("an organization's report preferences", () => {
  const preference = {
    id: 1,
    report_preference: {
      show_pcidss: true,
      show_hipaa: false,
      show_gdpr: false,
      show_nist: false,
      show_sama: false,
      show_dora: false,
      show_eucra: false,
      show_popia: false,
    },
  };

  it('reads which regulations the reports carry', async () => {
    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.preference(ORGANIZATION_ID)), () =>
        HttpResponse.json(preference)
      )
    );

    await expect(
      OrganizationService.getOrganizationPreference(ORGANIZATION_ID)
    ).resolves.toStrictEqual(preference);
  });

  it('writes the set whole, since the endpoint takes no single regulation', async () => {
    let sent: unknown = null;

    server.use(
      http.put(
        buildAPITestURL(OrganizationEndpoints.preference(ORGANIZATION_ID)),
        async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;

          sent = body;

          return HttpResponse.json(preference);
        }
      )
    );

    await OrganizationService.setOrganizationReportPreference(
      ORGANIZATION_ID,
      preference.report_preference
    );

    expect(sent).toStrictEqual({ report_preference: preference.report_preference });
  });
});

describe("an organization's email domains", () => {
  const domain = { id: 3, domain_name: 'example.com' };

  it('returns the domains as items with a count', async () => {
    server.use(
      http.get(buildAPITestURL(OrganizationEndpoints.emailDomains(ORGANIZATION_ID)), () =>
        HttpResponse.json(buildDrfPage([domain]))
      )
    );

    await expect(
      OrganizationService.getOrganizationEmailDomains(ORGANIZATION_ID)
    ).resolves.toMatchObject({ items: [domain], count: 1 });
  });

  it('adds a domain under the name the endpoint expects', async () => {
    let sent: unknown = null;

    server.use(
      http.post(
        buildAPITestURL(OrganizationEndpoints.emailDomains(ORGANIZATION_ID)),
        async ({ request }) => {
          const body = (await request.json()) as Record<string, unknown>;

          sent = body;

          return HttpResponse.json(domain);
        }
      )
    );

    await OrganizationService.addOrganizationEmailDomain(ORGANIZATION_ID, 'example.com');

    expect(sent).toStrictEqual({ domain_name: 'example.com' });
  });

  it('removes one domain', async () => {
    let removed = false;

    server.use(
      http.delete(
        buildAPITestURL(OrganizationEndpoints.emailDomain(ORGANIZATION_ID, domain.id)),
        () => {
          removed = true;

          return new HttpResponse(null, { status: HTTP_STATUS_CODES.NO_CONTENT });
        }
      )
    );

    await OrganizationService.deleteOrganizationEmailDomain(ORGANIZATION_ID, domain.id);

    expect(removed).toBe(true);
  });
});

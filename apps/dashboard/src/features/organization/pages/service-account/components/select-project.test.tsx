import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { Fragment, useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';

import { OrganizationEndpoints } from '@irene/api/services/organization/endpoints';
import { organizationStore } from '@irene/api/stores/organization';
import { clearStoredSession, storeSession } from '@irene/api/utils/session';
import { akMT } from '@irene/translations/intl';
import { AkToaster } from '@irene/ui/ak-toaster';
import type { ApiOrganizationProject } from '@irene/api/services/organization';

import {
  buildOrganization,
  buildOrganizationMe,
  buildOrganizationProject,
  buildSession,
} from '@tests/factories';

import { renderAtAddress } from '@tests/render';
import { server } from '@tests/server';

import { SelectProjectSection } from './select-project';

const ANDROID = buildOrganizationProject({ id: 11, package_name: 'com.example.app', platform: 0 });
const APPLE = buildOrganizationProject({ id: 12, package_name: 'com.example.ios', platform: 1 });

/** The section as the create screen drives it, with both choices held above it. */
function ProjectSection() {
  const [allProjects, setAllProjects] = useState(true);
  const [projects, setProjects] = useState<ApiOrganizationProject[]>([]);

  return (
    <Fragment>
      <SelectProjectSection
        allProjects={allProjects}
        onAllProjectsChange={setAllProjects}
        projects={projects}
        onProjectsChange={setProjects}
      />

      <AkToaster />
    </Fragment>
  );
}

/** Answers the organization's projects, which the picker lists. */
const withProjects = (projects: ApiOrganizationProject[]) =>
  server.use(
    http.get(`*/${OrganizationEndpoints.projects('*')}`, () =>
      HttpResponse.json({
        count: projects.length,
        next: null,
        previous: null,
        results: projects,
      })
    )
  );

/** Switches the access from every project to the ones chosen here. */
const chooseSpecificProjects = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByLabelText(akMT('serviceAccountModule.projectAccess')));

  await user.click(
    await screen.findByRole('option', { name: akMT('serviceAccountModule.forSpecificProjects') })
  );
};

beforeEach(() => {
  clearStoredSession();
  storeSession(buildSession());

  organizationStore
    .getState()
    .select(buildOrganization(), buildOrganizationMe({ is_owner: true, is_admin: true }));

  withProjects([ANDROID, APPLE]);
});

/** Opens the picker from whichever control the list offers. */
const openPicker = async (user: ReturnType<typeof userEvent.setup>, attribute: string) => {
  await user.click(document.querySelector(`[${attribute}]`) as HTMLElement);

  return waitFor(() => {
    const drawn = document.querySelector('[data-test-add-project-drawer]');

    expect(drawn).not.toBeNull();

    return drawn as HTMLElement;
  });
};

describe('the picker', () => {
  it('searches the organization’s projects, and says when it holds none', async () => {
    const user = userEvent.setup();

    renderAtAddress(<ProjectSection />, '/dashboard/service-account-create');

    await screen.findByText(akMT('allProjects'));
    await chooseSpecificProjects(user);

    const picker = await openPicker(user, 'data-test-service-account-add-project-empty');

    withProjects([]);

    await user.type(within(picker).getByLabelText(akMT('searchProject')), 'nothing-matches');

    expect(await within(picker).findByText(akMT('noProject'))).toBeInTheDocument();
  });

  it('leaves a project that is already chosen ticked and closed off', async () => {
    const user = userEvent.setup();

    renderAtAddress(<ProjectSection />, '/dashboard/service-account-create');

    await screen.findByText(akMT('allProjects'));
    await chooseSpecificProjects(user);

    const picker = await openPicker(user, 'data-test-service-account-add-project-empty');

    await user.click(await within(picker).findByLabelText(ANDROID.package_name));

    await user.click(picker.querySelector('[data-test-add-project-confirm]') as HTMLElement);

    const reopened = await openPicker(user, 'data-test-service-account-add-project');

    expect(await within(reopened).findByLabelText(ANDROID.package_name)).toBeDisabled();
    expect(within(reopened).getByLabelText(ANDROID.package_name)).toBeChecked();
  });

  it('forgets a project that is ticked and then unticked', async () => {
    const user = userEvent.setup();

    renderAtAddress(<ProjectSection />, '/dashboard/service-account-create');

    await screen.findByText(akMT('allProjects'));
    await chooseSpecificProjects(user);

    const picker = await openPicker(user, 'data-test-service-account-add-project-empty');

    /* The row is drawn again on each change, so the box is found again for the second press. */
    await user.click(await within(picker).findByLabelText(ANDROID.package_name));
    await user.click(await within(picker).findByLabelText(ANDROID.package_name));

    expect(picker.querySelector('[data-test-add-project-confirm]')).toBeDisabled();
  });

  it('starts its own list again from the first page when the page size changes', async () => {
    const user = userEvent.setup();

    renderAtAddress(<ProjectSection />, '/dashboard/service-account-create');

    await screen.findByText(akMT('allProjects'));
    await chooseSpecificProjects(user);

    const picker = await openPicker(user, 'data-test-service-account-add-project-empty');

    await within(picker).findByLabelText(ANDROID.package_name);

    await user.click(within(picker).getByLabelText(akMT('recordPerPage')));
    await user.click(await screen.findByRole('option', { name: '25' }));

    expect(await within(picker).findByLabelText(ANDROID.package_name)).toBeInTheDocument();
  });

  it('adds nothing when it is closed without a choice', async () => {
    const user = userEvent.setup();

    renderAtAddress(<ProjectSection />, '/dashboard/service-account-create');

    await screen.findByText(akMT('allProjects'));
    await chooseSpecificProjects(user);

    const picker = await openPicker(user, 'data-test-service-account-add-project-empty');

    expect(picker.querySelector('[data-test-add-project-confirm]')).toBeDisabled();

    await user.click(picker.querySelector('[data-test-add-project-cancel]') as HTMLElement);

    expect(
      await screen.findByText(akMT('serviceAccountModule.emptyProjectListTitle'))
    ).toBeInTheDocument();
  });
});

describe('a long list of chosen projects', () => {
  it('is paged, and a page holds only its own', async () => {
    const user = userEvent.setup();

    const many = Array.from({ length: 6 }, (_, index) =>
      buildOrganizationProject({
        id: 100 + index,
        package_name: `com.example.app${index}`,
        platform: 0,
      })
    );

    withProjects(many);

    renderAtAddress(<ProjectSection />, '/dashboard/service-account-create');

    await screen.findByText(akMT('allProjects'));
    await chooseSpecificProjects(user);

    const picker = await openPicker(user, 'data-test-service-account-add-project-empty');

    for (const project of many) {
      await user.click(await within(picker).findByLabelText(project.package_name));
    }

    await user.click(picker.querySelector('[data-test-add-project-confirm]') as HTMLElement);

    /* Five to a page, as irene pages the chosen list, so the sixth waits for the next. */
    await waitFor(() =>
      expect(document.querySelectorAll('[data-test-service-account-project-item]')).toHaveLength(5)
    );

    expect(screen.queryByText('com.example.app5')).not.toBeInTheDocument();
  });
});

describe('the select project section', () => {
  it('opens on every project, with no list to choose from', async () => {
    renderAtAddress(<ProjectSection />, '/dashboard/service-account-create');

    expect(await screen.findByText(akMT('allProjects'))).toBeInTheDocument();
    expect(document.querySelector('[data-test-service-account-project-list]')).toBeNull();

    expect(
      screen.getByText(akMT('serviceAccountModule.projectAccessDescription'))
    ).toBeInTheDocument();
  });

  it('says nothing has been added once the access is narrowed', async () => {
    const user = userEvent.setup();

    renderAtAddress(<ProjectSection />, '/dashboard/service-account-create');

    await screen.findByText(akMT('allProjects'));
    await chooseSpecificProjects(user);

    expect(
      await screen.findByText(akMT('serviceAccountModule.emptyProjectListTitle'))
    ).toBeInTheDocument();
  });

  it('adds what is ticked in the picker, and keeps it until the page is saved', async () => {
    const user = userEvent.setup();

    renderAtAddress(<ProjectSection />, '/dashboard/service-account-create');

    await screen.findByText(akMT('allProjects'));
    await chooseSpecificProjects(user);

    await user.click(
      document.querySelector('[data-test-service-account-add-project-empty]') as HTMLElement
    );

    const picker = await waitFor(() => {
      const drawn = document.querySelector('[data-test-add-project-drawer]');

      expect(drawn).not.toBeNull();

      return drawn as HTMLElement;
    });

    await user.click(await within(picker).findByLabelText(ANDROID.package_name));

    await user.click(picker.querySelector('[data-test-add-project-confirm]') as HTMLElement);

    await waitFor(() =>
      expect(
        document.querySelector(`[data-test-service-account-project-item="${ANDROID.id}"]`)
      ).not.toBeNull()
    );

    expect(screen.getByText(ANDROID.package_name)).toBeInTheDocument();
  });

  it('takes a project back off the list', async () => {
    const user = userEvent.setup();

    renderAtAddress(<ProjectSection />, '/dashboard/service-account-create');

    await screen.findByText(akMT('allProjects'));
    await chooseSpecificProjects(user);

    await user.click(
      document.querySelector('[data-test-service-account-add-project-empty]') as HTMLElement
    );

    const picker = await waitFor(() => {
      const drawn = document.querySelector('[data-test-add-project-drawer]');

      expect(drawn).not.toBeNull();

      return drawn as HTMLElement;
    });

    await user.click(await within(picker).findByLabelText(APPLE.package_name));

    await user.click(picker.querySelector('[data-test-add-project-confirm]') as HTMLElement);

    await waitFor(() =>
      expect(
        document.querySelector(`[data-test-service-account-remove-project="${APPLE.id}"]`)
      ).not.toBeNull()
    );

    await user.click(
      document.querySelector(
        `[data-test-service-account-remove-project="${APPLE.id}"]`
      ) as HTMLElement
    );

    expect(
      await screen.findByText(akMT('serviceAccountModule.emptyProjectListTitle'))
    ).toBeInTheDocument();
  });
});

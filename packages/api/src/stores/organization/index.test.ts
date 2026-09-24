import { beforeEach, describe, expect, it } from 'vitest';

import { organizationStore } from '@irene/api/stores/organization';
import { buildOrganization, buildOrganizationMe } from '@tests/factories';

const organization = () => organizationStore.getState();

describe('organizationStore', () => {
  beforeEach(() => {
    organization().clear();
  });

  it('starts with selected and me both null', () => {
    expect(organization().selected).toBeNull();
    expect(organization().me).toBeNull();
  });

  it('stores the organization and the permissions passed to select', () => {
    const selected = buildOrganization();
    const me = buildOrganizationMe({ is_owner: true });

    organization().select(selected, me);

    expect(organization().selected).toEqual(selected);
    expect(organization().me).toEqual(me);
  });

  it('sets selected and me to null on clear', () => {
    organization().select(buildOrganization(), buildOrganizationMe({ is_admin: true }));
    organization().clear();

    expect(organization().selected).toBeNull();
    expect(organization().me).toBeNull();
  });

  it('notifies subscribers on select and on clear', () => {
    const seen: (number | null)[] = [];
    const stop = organizationStore.subscribe((state) => seen.push(state.selected?.id ?? null));

    const selected = buildOrganization();

    organization().select(selected, buildOrganizationMe());
    organization().clear();
    stop();

    expect(seen).toEqual([selected.id, null]);
  });
});

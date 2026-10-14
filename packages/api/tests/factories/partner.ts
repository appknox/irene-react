import { faker } from '@faker-js/faker';
import type { ApiPartner, ApiPartnerAccess } from '@irene/api/services/partner';

/** What a partner may do, with everything off unless a test says otherwise. */
const buildAccess = (overrides: Partial<ApiPartnerAccess> = {}): ApiPartnerAccess => ({
  view_plans: false,
  transfer_credits: false,
  list_projects: false,
  list_files: false,
  view_analytics: false,
  view_reports: false,
  admin_registration: false,
  ...overrides,
});

/** What a partner organization is, and what it may do. */
export const buildPartner = ({
  access,
  ...overrides
}: Partial<Omit<ApiPartner, 'access'>> & {
  access?: Partial<ApiPartnerAccess>;
} = {}): ApiPartner => ({
  id: faker.number.int({ min: 1, max: 9999 }),
  ...overrides,
  access: buildAccess(access),
});

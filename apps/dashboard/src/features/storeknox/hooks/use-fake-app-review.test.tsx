import { faker } from '@faker-js/faker';
import { useQuery } from '@tanstack/react-query';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';

import { StoreknoxEndpoints } from '@irene/api/services/storeknox';
import { ENUMS } from '@irene/enums';

import { skFakeAppInventoryOptions } from '@/features/storeknox/queries/fake-apps';
import { buildBrandAbuseSkFakeApp, buildSkFakeAppInventoryApp } from '@tests/factories';
import { renderWithProviders } from '@tests/render';
import { buildAPITestURL, server } from '@tests/server';
import { mockSkFakeAppReview } from '@tests/storeknox';

import { useFakeAppReview } from './use-fake-app-review';

const PARAMS = { limit: 10, offset: 0 };

function Harness({
  skAppId,
  addToInventory,
}: Readonly<{ skAppId: number; addToInventory: boolean }>) {
  const listing = useQuery(skFakeAppInventoryOptions(PARAMS));
  const review = useFakeAppReview(skAppId);
  const [app] = listing.data?.items ?? [];

  return (
    <>
      <span data-test-total>{app?.fake_app_counts?.brand_abuse}</span>

      <button
        type="button"
        onClick={() =>
          review.mutate({
            fakeApp: buildBrandAbuseSkFakeApp({ id: 1 }),
            addToInventory,
            reason: faker.lorem.word(),
          })
        }
      >
        review
      </button>
    </>
  );
}

describe('useFakeAppReview', () => {
  it.each([false, true])(
    'refreshes the fake-app listing totals after a review (add to inventory: %s)',
    async (addToInventory) => {
      const skAppId = faker.number.int({ min: 1, max: 999 });

      const before = buildSkFakeAppInventoryApp({
        id: skAppId,
        fake_app_counts: {
          brand_abuse: faker.number.int({ min: 1, max: 50 }),
          fake_app: 1,
          ignored: 0,
        },
      });

      const after = buildSkFakeAppInventoryApp({
        ...before,
        fake_app_counts: {
          brand_abuse: 100 + faker.number.int({ min: 1, max: 50 }),
          fake_app: 2,
          ignored: 3,
        },
      });

      let served = before;

      server.use(
        http.get(buildAPITestURL(StoreknoxEndpoints.fakeAppInventory()), () =>
          HttpResponse.json({ count: 1, next: null, previous: null, results: [served] })
        )
      );

      mockSkFakeAppReview(skAppId, 1, addToInventory ? 'add-to-inventory' : 'ignore', {
        id: 1,
        status: ENUMS.SK_FAKE_APP_STATUS.IGNORED,
        status_display: 'Ignored',
        reviewed_by: faker.person.fullName(),
        reviewed_on: faker.date.recent().toISOString(),
      });

      renderWithProviders(<Harness skAppId={skAppId} addToInventory={addToInventory} />);

      expect(await screen.findByText(String(before.fake_app_counts?.brand_abuse))).toBeVisible();
      const refreshed = String(after.fake_app_counts?.brand_abuse);

      served = after;

      await userEvent.click(screen.getByRole('button', { name: 'review' }));

      await waitFor(() => expect(screen.getByText(refreshed)).toBeVisible());
    }
  );
});

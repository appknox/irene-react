import { useMutation, useQueryClient } from '@tanstack/react-query';

import { StoreknoxService, type ApiSkFakeApp } from '@irene/api/services/storeknox';
import { unlessRateLimited } from '@irene/api/utils/errors';
import { akMT } from '@irene/translations/intl';
import { akNotify } from '@irene/ui/notify';

import { skFakeAppKeys } from '@/features/storeknox/queries/fake-apps';
import { skInventoryAppOptions, storeknoxKeys } from '@/features/storeknox/queries/inventory';
import { skErrorMessage } from '@/features/storeknox/utils/error-message';

interface FakeAppReview {
  fakeApp: ApiSkFakeApp;
  /** Whether the copy's store listing is also added to the inventory. */
  addToInventory: boolean;
  reason: string;
}

/** What the toast says for an action on a copy of its classification. */
function _successMessage({ fakeApp, addToInventory }: FakeAppReview) {
  const brandAbuse = fakeApp.ai_classification_label === 'brand_abuse';

  if (addToInventory) {
    return brandAbuse
      ? akMT('storeknox.appIgnoredAndAddedToInventorySuccessfully')
      : akMT('storeknox.fakeAppIgnoredAndAddedToInventory');
  }

  return brandAbuse ? akMT('storeknox.appIgnoredSuccessfully') : akMT('storeknox.fakeAppIgnored');
}

/**
 * Ignores a copy of an inventory app, or ignores it and adds it to the inventory.
 *
 * The server answers with a few fields of the copy, so they are merged into the cached record
 * rather than replacing it, which would drop the AI's findings. The lists, the app's record and
 * the inventory lists are refetched, since the tab counts and the listing's totals live on the app.
 *
 * @param skAppId - The inventory app the copy belongs to; the request path uses it, as irene's
 *   adapter does not take the response's `sk_app`.
 */
export function useFakeAppReview(skAppId: number | string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ fakeApp, addToInventory, reason }: FakeAppReview) =>
      addToInventory
        ? StoreknoxService.addFakeAppToInventory(skAppId, fakeApp.id, reason)
        : StoreknoxService.ignoreFakeApp(skAppId, fakeApp.id, reason),

    onSuccess: (response, review) => {
      queryClient.setQueryData<ApiSkFakeApp>(
        skFakeAppKeys.detail(skAppId, review.fakeApp.id),
        (previous) => previous && { ...previous, ...response }
      );

      void queryClient.invalidateQueries({ queryKey: skFakeAppKeys.listsFor(skAppId) });
      void queryClient.invalidateQueries({ queryKey: skInventoryAppOptions(skAppId).queryKey });
      void queryClient.invalidateQueries({ queryKey: storeknoxKeys.apps() });

      akNotify.success(_successMessage(review));
    },

    onError: unlessRateLimited((error) => akNotify.error(skErrorMessage(error))),
  });
}

import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';

import { queryClient } from '@irene/api';
import { TranslationsProvider } from '@irene/translations/provider';
import { AkToaster } from '@irene/ui/ak-toaster';

import { QueryDevtools } from '@/components/query-devtools';
import { ireneDashboardRouter } from '@/router';

export function App() {
  return (
    <TranslationsProvider>
      <QueryClientProvider client={queryClient}>
        <RouterProvider router={ireneDashboardRouter} />
        <QueryDevtools />
        <AkToaster />
      </QueryClientProvider>
    </TranslationsProvider>
  );
}

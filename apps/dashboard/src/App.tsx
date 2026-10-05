import { QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider } from '@tanstack/react-router';

import { queryClient } from '@irene/api';
import { TranslationsProvider } from '@irene/translations/provider';
import { AkToaster } from '@irene/ui/ak-toaster';

import { BootOverlay } from '@/components/boot-overlay';
import { NormalizationProvider } from '@/components/normalization-provider';
import { QueryDevtools } from '@/components/query-devtools';
import { ireneDashboardRouter } from '@/router';

export function App() {
  return (
    <TranslationsProvider>
      <NormalizationProvider queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={ireneDashboardRouter} />

          <BootOverlay router={ireneDashboardRouter} />

          <QueryDevtools />

          <AkToaster />
        </QueryClientProvider>
      </NormalizationProvider>
    </TranslationsProvider>
  );
}

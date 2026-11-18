import { QueryClientProvider } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { queryClient } from '@irene/api';
import { TranslationsProvider } from '@irene/translations/provider';
import { AkToaster } from '@irene/ui/ak-toaster';

import { NormalizationProvider } from '@/components/normalization-provider';

/**
 * Everything a component from this app needs around it, wherever it renders.
 *
 * Mirrors the application's own root. One query client, so two components
 * embedded in one document share a cache rather than fetching the same thing
 * twice.
 *
 * @param props.children - What is being rendered.
 */
export function EmbedProviders({ children }: Readonly<{ children: ReactNode }>) {
  return (
    <TranslationsProvider>
      <NormalizationProvider queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          {children}

          <AkToaster />
        </QueryClientProvider>
      </NormalizationProvider>
    </TranslationsProvider>
  );
}

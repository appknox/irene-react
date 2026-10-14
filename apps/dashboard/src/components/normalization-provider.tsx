import { QueryNormalizerProvider } from '@normy/react-query';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

import { NORMALIZER_CONFIG } from '@irene/api/normalization';

interface NormalizationProviderProps {
  queryClient: QueryClient;
  children: ReactNode;
}

/**
 * Keeps a normalized view of the query cache, keyed by what each record is.
 *
 * An app wraps its `QueryClientProvider` in this. Without it a record read by
 * two queries is two unrelated copies, and anything holding one record — a
 * socket event, a mutation reply — would have to name every query it might be in.
 *
 * @param props.queryClient - The cache to keep a normalized view of.
 * @param props.children - The app.
 */
export function NormalizationProvider({
  queryClient,
  children,
}: Readonly<NormalizationProviderProps>) {
  return (
    <QueryNormalizerProvider queryClient={queryClient} normalizerConfig={NORMALIZER_CONFIG}>
      {children}
    </QueryNormalizerProvider>
  );
}

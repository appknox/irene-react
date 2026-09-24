import { lazy, Suspense } from 'react';

/** Lazy so the devtools bundle is never requested in production. */
const Devtools = lazy(async () => {
  const module = await import('@tanstack/react-query-devtools');

  return { default: module.ReactQueryDevtools };
});

export function QueryDevtools() {
  if (!import.meta.env.DEV) {
    return null;
  }

  return (
    <Suspense fallback={null}>
      <Devtools initialIsOpen={false} />
    </Suspense>
  );
}

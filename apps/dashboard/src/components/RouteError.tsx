import type { ErrorComponentProps } from '@tanstack/react-router';

export function RouteError({ error }: ErrorComponentProps) {
  return (
    <div role="alert" className="p-4">
      <h1 className="text-lg font-semibold">Something went wrong</h1>

      {import.meta.env.DEV && (
        <pre className="mt-2 overflow-x-auto text-sm text-muted-foreground">
          {error instanceof Error ? error.message : String(error)}
        </pre>
      )}
    </div>
  );
}

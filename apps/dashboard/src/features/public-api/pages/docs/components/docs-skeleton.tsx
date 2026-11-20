import { AkSkeleton } from '@irene/ui/ak-skeleton';

/* Each section stands in for a tag's worth of operations, widest first. */
const SECTIONS = [
  { id: 'projects', heading: '40%', rows: ['62%', '48%', '70%'] },
  { id: 'files', heading: '32%', rows: ['55%', '66%'] },
  { id: 'analyses', heading: '36%', rows: ['71%', '44%', '58%', '64%'] },
];

/**
 * Stands in for the API documentation while the specification is fetched.
 *
 * Shaped like the document it replaces — a heading row, then a block of
 * operations per tag — so the page does not jump when the real one arrives.
 */
export function DocsSkeleton() {
  return (
    <div className="flex w-full flex-col gap-5.25" data-test-public-api-docs-skeleton>
      <div className="flex w-full items-center justify-between">
        <AkSkeleton width="300px" height="34px" />

        <AkSkeleton width="250px" height="34px" />
      </div>

      {SECTIONS.map((section) => (
        <div key={section.id} className="flex w-full flex-col gap-3.5">
          <AkSkeleton width={section.heading} height="20px" />

          {section.rows.map((row) => (
            <div key={row} className="flex w-full items-center gap-1.75">
              <AkSkeleton variant="circular" width="10px" height="10px" />

              <AkSkeleton width={row} height="18px" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

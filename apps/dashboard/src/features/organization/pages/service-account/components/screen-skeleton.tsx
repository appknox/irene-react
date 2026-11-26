import { AkSkeleton } from '@irene/ui/ak-skeleton';

/** One label and the value under it, as a section writes each of its fields. */
function FieldSkeleton({
  labelWidth,
  valueWidth,
}: Readonly<{ labelWidth: string; valueWidth: string }>) {
  return (
    <div className="flex flex-col gap-1">
      <AkSkeleton className={`h-3.5 ${labelWidth}`} />

      <AkSkeleton className={`h-4 ${valueWidth}`} />
    </div>
  );
}

/**
 * One section's card while it loads.
 *
 * It keeps the card's own chrome — the border, the tinted header with the
 * control at its end, the rule and the body's padding — and stands in for the
 * fields as the label-and-value pairs they are, so nothing moves when the
 * account arrives.
 *
 * @param props.fields - The label and value widths of each field the section holds.
 */
function SectionSkeleton({
  fields,
}: Readonly<{ fields: { labelWidth: string; valueWidth: string }[] }>) {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between px-5.25 py-3.5">
        <AkSkeleton className="h-4 w-43.75" />

        <AkSkeleton variant="rectangular" className="size-8 rounded-xs" />
      </div>

      <div className="flex flex-col gap-5.25 px-5.25 pb-5.25">
        {fields.map((field) => (
          <FieldSkeleton
            key={field.labelWidth + field.valueWidth}
            labelWidth={field.labelWidth}
            valueWidth={field.valueWidth}
          />
        ))}
      </div>
    </div>
  );
}

/** What each of the four sections holds, as the widths its fields take. */
const SECTIONS = [
  {
    key: 'overview',
    fields: [
      { labelWidth: 'w-50', valueWidth: 'w-37.5' },
      { labelWidth: 'w-25', valueWidth: 'w-62.5' },
    ],
  },
  {
    key: 'token',
    fields: [
      { labelWidth: 'w-31.25', valueWidth: 'w-75' },
      { labelWidth: 'w-25', valueWidth: 'w-37.5' },
    ],
  },
  {
    key: 'scope',
    fields: [
      { labelWidth: 'w-37.5', valueWidth: 'w-50' },
      { labelWidth: 'w-31.25', valueWidth: 'w-43.75' },
      { labelWidth: 'w-35', valueWidth: 'w-56.25' },
    ],
  },
  { key: 'projects', fields: [{ labelWidth: 'w-31.25', valueWidth: 'w-62.5' }] },
];

/**
 * The service account screen while the account it is about is being read.
 *
 * It draws the screen the account will fill: the trail, the header card and the
 * four sections under it, each at the size and in the place the real one takes.
 */
export function ServiceAccountScreenSkeleton() {
  return (
    <div
      className="flex min-h-[calc(100vh-56px)] w-full flex-col"
      data-test-service-account-screen-skeleton
    >
      {/* The trail: three steps and the marks between them. */}
      <div className="flex items-center gap-1 pt-3.5 pb-5.25">
        <AkSkeleton className="h-3.5 w-20" />

        <AkSkeleton className="h-3.5 w-1" />

        <AkSkeleton className="h-3.5 w-15" />

        <AkSkeleton className="h-3.5 w-1" />

        <AkSkeleton className="h-3.5 w-25" />
      </div>

      <div className="flex items-center justify-between gap-2.75 p-5.25">
        <div className="flex flex-col gap-1">
          <AkSkeleton className="h-4 w-50" />

          <AkSkeleton className="h-3 w-100" />
        </div>

        <AkSkeleton variant="rectangular" className="size-9 rounded-xs" />
      </div>

      <div className="my-5.25 flex w-full flex-col gap-5.25">
        {SECTIONS.map((section) => (
          <SectionSkeleton key={section.key} fields={section.fields} />
        ))}
      </div>
    </div>
  );
}

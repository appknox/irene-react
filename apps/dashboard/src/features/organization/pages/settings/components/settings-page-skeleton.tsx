import { Fragment } from 'react';

import { AkSkeleton } from '@irene/ui/ak-skeleton';

import { TableSkeleton } from './table-skeleton';

/*
  Each section stands in as the section itself: the same rows in the same places, at the
  size each control and each line of text takes. Nothing is tinted, outlined or boxed —
  the grey of the stand-ins is the only colour here, and the layout does the rest.
*/

/** The heading of a section, and the two lines of introduction where it has them. */
function Heading({ hasIntroduction = false }: Readonly<{ hasIntroduction?: boolean }>) {
  return (
    <Fragment>
      <AkSkeleton className={`h-4 w-50 ${hasIntroduction ? 'mb-2' : ''}`} />

      {hasIntroduction && (
        <div className="flex flex-col gap-1">
          <AkSkeleton className="h-3.5 w-62.5" />

          <AkSkeleton className="h-3 w-100" />
        </div>
      )}
    </Fragment>
  );
}

/** A switch, at the size the small one is drawn and in the margin it carries. */
function Switch() {
  return <AkSkeleton variant="rectangular" className="m-1.5 h-4.25 w-8.5 rounded-full" />;
}

/** A box to tick, at its size and in the padded field it sits in. */
function Box() {
  return (
    <span className="inline-flex p-1.5">
      <AkSkeleton variant="rectangular" className="m-0.5 size-4 rounded-xs" />
    </span>
  );
}

/** Whether members may ask for an analysis to be overridden. */
function EditAnalysisSkeleton() {
  return (
    <section className="flex w-full flex-col">
      <Heading />

      <div className="mt-1.75 flex w-full items-center justify-between">
        <div className="flex flex-col">
          <AkSkeleton className="mb-1.75 h-3.5 w-62.5" />

          <AkSkeleton className="h-3 w-112.5" />
        </div>

        <Switch />
      </div>
    </section>
  );
}

/** Which regulations the reports carry: a box and a name, one under another. */
function RegulatoryPreferencesSkeleton() {
  return (
    <section className="flex w-full max-w-150 flex-col">
      <Heading hasIntroduction />

      <div className="mt-3.5 flex flex-col">
        {['w-12.5', 'w-15', 'w-11.25', 'w-10', 'w-13.75', 'w-11.25', 'w-15', 'w-13.75'].map(
          (width) => (
            <div key={width} className="flex items-center">
              <Box />

              <AkSkeleton className={`h-3.5 ${width}`} />
            </div>
          )
        )}
      </div>
    </section>
  );
}

/** The second factor: a switch, its label, and the notice under them. */
function MfaSkeleton() {
  return (
    <section className="flex w-full max-w-150 flex-col">
      <Heading hasIntroduction />

      <div className="mt-3.5 mb-5.25 flex items-center">
        <Switch />

        <AkSkeleton className="h-3.5 w-75" />
      </div>

      <div className="mb-3.5 flex items-center py-3.5">
        <AkSkeleton variant="circular" className="size-5.25 shrink-0" />

        <AkSkeleton className="ml-3.5 h-3.5 w-full max-w-100" />
      </div>
    </section>
  );
}

/** Sign-on: the two tabs, and the boxes the open one holds. */
function SsoSkeleton() {
  return (
    <section className="flex w-full max-w-200 flex-col">
      <Heading />

      <div className="mt-2 mb-3.5 flex items-center gap-5.25 pb-2.75">
        <AkSkeleton className="h-3.5 w-37.5" />

        <AkSkeleton className="h-3.5 w-15" />
      </div>

      <AkSkeleton className="mb-5.25 h-3 w-full" />

      <div className="mb-5.25 flex w-full flex-col">
        <div className="flex flex-col gap-1 p-3.5">
          <AkSkeleton className="h-3.5 w-43.75" />

          <AkSkeleton className="h-3 w-75" />
        </div>

        <div className="flex items-center gap-5.25 p-3.5">
          <AkSkeleton className="h-3.5 w-25" />

          <AkSkeleton className="h-3.5 w-25" />
        </div>

        <div className="flex flex-col gap-3.5 p-3.5">
          {['w-1/3', 'w-2/3', 'w-1/2'].map((width) => (
            <div key={width} className="flex gap-3.5">
              <AkSkeleton className="h-3.5 w-1/4" />

              <AkSkeleton className={`h-3.5 ${width}`} />
            </div>
          ))}
        </div>
      </div>

      <div className="flex w-full flex-col">
        <div className="p-3.5">
          <AkSkeleton className="h-3.5 w-37.5" />
        </div>

        <div className="flex items-center p-3.5">
          <Switch />

          <AkSkeleton className="h-3.5 w-62.5" />
        </div>
      </div>
    </section>
  );
}

/** The domains: the field they are added in, and the ones already held. */
function EmailDomainsSkeleton() {
  return (
    <section className="flex w-full max-w-150 flex-col">
      <AkSkeleton className="mb-2 h-4 w-62.5" />

      <AkSkeleton className="h-3 w-full" />

      <div className="mt-5.25 flex items-end">
        <div className="flex w-8/12 flex-col gap-1.5">
          <AkSkeleton className="h-3.5 w-31.25" />

          <AkSkeleton variant="rectangular" className="h-9 w-full rounded-xs" />
        </div>

        <AkSkeleton variant="rectangular" className="mx-3.5 h-9 w-25 rounded-xs" />
      </div>

      <div className="mt-3.5 flex flex-wrap gap-2.75">
        {['w-25', 'w-31.25', 'w-20'].map((width) => (
          <AkSkeleton key={width} variant="rectangular" className={`h-7 rounded-xs ${width}`} />
        ))}
      </div>
    </section>
  );
}

/** The exports: what is asked for, and what has been asked for before. */
function ArchiveSkeleton() {
  return (
    <section className="flex w-full flex-col">
      <Heading />

      <div className="my-5.25 flex flex-col gap-1.75">
        <AkSkeleton className="h-3.5 w-43.75" />

        <AkSkeleton variant="rectangular" className="h-9 w-100 rounded-xs" />

        <AkSkeleton className="h-3 w-full max-w-200" />
      </div>

      <div className="flex flex-col gap-1">
        <AkSkeleton className="h-3.5 w-37.5" />

        <AkSkeleton className="h-3 w-62.5" />
      </div>

      <div className="my-3.5 max-w-200">
        <TableSkeleton widths={['w-1/5', 'w-1/5', 'w-1/5', 'w-1/5', 'w-1/12']} rows={3} />
      </div>
    </section>
  );
}

/** Storage: the switch, what it governs, and the field it is kept to. */
function FileCleanupSkeleton() {
  return (
    <section className="flex w-full flex-col">
      <Heading />

      <div className="mt-1.75 flex gap-3.5">
        <AkSkeleton variant="rectangular" className="m-1.5 h-6 w-12 shrink-0 rounded-full" />

        <div className="flex w-full flex-col gap-1">
          <AkSkeleton className="h-4 w-31.25" />

          <AkSkeleton className="h-3 w-full max-w-200" />

          <AkSkeleton className="h-3 w-3/4 max-w-150" />

          <div className="mt-3.5 flex w-8/12 items-end gap-3.5">
            <div className="flex w-full flex-col gap-1">
              <AkSkeleton className="h-3.5 w-31.25" />

              <AkSkeleton variant="rectangular" className="h-9 w-full rounded-xs" />
            </div>

            <AkSkeleton variant="rectangular" className="size-9 rounded-xs" />
          </div>
        </div>
      </div>
    </section>
  );
}

/* The sections, in the order the screen draws them. */
const SECTIONS = [
  { key: 'edit-analysis', skeleton: <EditAnalysisSkeleton /> },
  { key: 'regulatory', skeleton: <RegulatoryPreferencesSkeleton /> },
  { key: 'mfa', skeleton: <MfaSkeleton /> },
  { key: 'sso', skeleton: <SsoSkeleton /> },
  { key: 'email-domains', skeleton: <EmailDomainsSkeleton /> },
  { key: 'archive', skeleton: <ArchiveSkeleton /> },
  { key: 'file-cleanup', skeleton: <FileCleanupSkeleton /> },
];

/**
 * The settings screen while its answers are read.
 *
 * It draws the screen itself, section for section, with the words greyed. The
 * sections only an owner is shown are drawn too: what this account may see is
 * one of the answers still on its way.
 */
export function SettingsPageSkeleton() {
  return (
    <div className="flex w-full flex-col px-7 pt-5.25 pb-17.5" data-test-org-settings-loading>
      {SECTIONS.map((section) => (
        <div key={section.key} className="mb-10.5">
          {section.skeleton}
        </div>
      ))}
    </div>
  );
}

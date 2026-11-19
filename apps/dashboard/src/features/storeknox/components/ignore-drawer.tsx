import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { formatDateTime } from '@irene/translations/date-time';
import { akMT } from '@irene/translations/intl';
import { AkButton } from '@irene/ui/ak-button';
import { AkDivider } from '@irene/ui/ak-divider';
import { AkDrawer, AkDrawerClose, AkDrawerContent, AkDrawerHeader } from '@irene/ui/ak-drawer';
import { AkFormProvider } from '@irene/ui/ak-form';
import { AkTypography } from '@irene/ui/ak-typography';
import { cn } from '@irene/ui/cn';
import type { ApiSkFakeApp } from '@irene/api/services/storeknox';

import {
  IgnoreFakeAppField,
  ignoreFakeAppSchema,
  type IgnoreFakeAppSchema,
} from '@/features/storeknox/schemas/ignore-fake-app';

import { useFakeAppReview } from '@/features/storeknox/hooks/use-fake-app-review';
import { isFakeAppAddedToInventory, isFakeAppIgnored } from '@/features/storeknox/utils/fake-app';

interface IgnoreDrawerProps {
  skAppId: number | string;
  fakeApp: ApiSkFakeApp;
  /** Whether confirming also adds the copy's store listing to the inventory. */
  addToInventory: boolean;
  open: boolean;
  onClose: () => void;
}

/** Who ignored the copy, when, and why, for a copy that has been ignored. */
function IgnoredDetails({ fakeApp }: Readonly<{ fakeApp: ApiSkFakeApp }>) {
  const addedToInventory = isFakeAppAddedToInventory(fakeApp);

  const details = [
    {
      label: addedToInventory
        ? akMT('storeknox.ignoredAndAddedToInventoryOn')
        : akMT('storeknox.ignoredOn'),
      value: fakeApp.reviewed_on ? formatDateTime(fakeApp.reviewed_on, 'longDate') : '',
    },
    {
      label: addedToInventory
        ? akMT('storeknox.ignoredAndAddedToInventoryBy')
        : akMT('storeknox.ignoredBy'),
      value: fakeApp.reviewed_by,
    },
    { label: akMT('reason'), value: fakeApp.ignore_reason },
  ];

  return (
    <>
      <dl className="flex flex-col gap-3 p-4">
        {details.map(({ label, value }) => (
          <div key={label} className="flex items-start gap-2">
            <AkTypography
              tag="dt"
              color="textSecondary"
              className={cn(addedToInventory ? 'min-w-62.5' : 'min-w-40')}
            >
              {label}
            </AkTypography>

            <AkTypography tag="dd" fontWeight="medium">
              {value}
            </AkTypography>
          </div>
        ))}
      </dl>

      {/* The wording follows the status; the link needs the inventory app's id. */}
      {addedToInventory && fakeApp.added_to_inventory_app !== null && (
        <>
          <AkDivider color="dark" />

          <div className="p-4">
            <AkButton asChild variant="outlined" color="neutral">
              <Link
                to="/dashboard/storeknox/inventory-details/$id"
                params={{ id: String(fakeApp.added_to_inventory_app) }}
              >
                {akMT('storeknox.viewInInventory')}
              </Link>
            </AkButton>
          </div>
        </>
      )}
    </>
  );
}

/** The reason form. It mounts with the drawer's content, so each opening starts empty. */
function IgnoreForm({
  skAppId,
  fakeApp,
  addToInventory,
  onClose,
}: Readonly<Omit<IgnoreDrawerProps, 'open'>>) {
  const review = useFakeAppReview(skAppId);

  const form = useForm<IgnoreFakeAppSchema>({
    resolver: zodResolver(ignoreFakeAppSchema),
    defaultValues: { reason: '' },
    mode: 'onChange',
  });

  const submit = form.handleSubmit(({ reason }) =>
    review.mutate({ fakeApp, addToInventory, reason }, { onSuccess: onClose })
  );

  return (
    <AkFormProvider {...form}>
      <form noValidate onSubmit={submit}>
        <div className="flex flex-col gap-5 p-4">
          <AkTypography>
            {addToInventory
              ? akMT('storeknox.ignoreConfirmationPromptAndAddToInventory', {
                  appName: fakeApp.title,
                })
              : akMT('storeknox.ignoreConfirmationPrompt', { appName: fakeApp.title })}
          </AkTypography>

          <IgnoreFakeAppField
            name="reason"
            label={akMT('reason')}
            labelProps={{ className: 'text-sm text-foreground-muted' }}
          >
            <textarea
              rows={6}
              placeholder={akMT('storeknox.ignoreReasonPlaceholder')}
              className="
                w-full resize-y rounded-sm border border-input bg-transparent px-3 py-2 text-base
                outline-none
                placeholder:text-muted-foreground
                focus-visible:border-border-strong
                aria-invalid:border-danger
              "
            />
          </IgnoreFakeAppField>
        </div>

        <AkDivider color="dark" />

        <div className="flex items-center gap-3 p-4">
          <AkButton
            type="submit"
            loading={review.isPending}
            disabled={!form.formState.isValid}
            data-test-sk-ignore-confirm
          >
            {addToInventory
              ? akMT('storeknox.yesIgnoreAndAddToInventory')
              : akMT('storeknox.yesIgnore')}
          </AkButton>

          <AkDrawerClose asChild>
            <AkButton variant="outlined" color="neutral" disabled={review.isPending}>
              {akMT('cancel')}
            </AkButton>
          </AkDrawerClose>
        </div>
      </form>
    </AkFormProvider>
  );
}

/**
 * The drawer a reviewer ignores a copy from, with a required reason; for a copy already
 * ignored it shows the date, reviewer and reason read-only. Which of the two it shows is
 * fixed while it is open.
 *
 * @param props.skAppId - The inventory app the copy belongs to.
 * @param props.fakeApp - The copy.
 * @param props.addToInventory - Whether confirming also adds the copy to the inventory.
 * @param props.open - Whether the drawer is shown.
 * @param props.onClose - Called when it closes, after a confirmation or a dismissal.
 */
export function IgnoreDrawer({
  skAppId,
  fakeApp,
  addToInventory,
  open,
  onClose,
}: Readonly<IgnoreDrawerProps>) {
  const [wasOpen, setWasOpen] = useState(open);
  const [ignored, setIgnored] = useState(() => isFakeAppIgnored(fakeApp));

  /*
   * The mode is taken when the drawer opens and held until it closes: confirming merges the
   * IGNORED status into the copy, which would otherwise turn the form into the read-only view
   * while the drawer animates out.
   */
  if (open !== wasOpen) {
    setWasOpen(open);

    if (open) {
      setIgnored(isFakeAppIgnored(fakeApp));
    }
  }

  return (
    <AkDrawer open={open} onOpenChange={(next) => !next && onClose()}>
      <AkDrawerContent
        aria-describedby={undefined}
        className="w-125 max-w-full"
        data-test-sk-ignore-drawer
      >
        <AkDrawerHeader
          title={ignored ? akMT('storeknox.ignoredDetails') : akMT('confirmation')}
          closeLabel={akMT('close')}
        />

        {ignored ? (
          <IgnoredDetails fakeApp={fakeApp} />
        ) : (
          <IgnoreForm
            skAppId={skAppId}
            fakeApp={fakeApp}
            addToInventory={addToInventory}
            onClose={onClose}
          />
        )}
      </AkDrawerContent>
    </AkDrawer>
  );
}

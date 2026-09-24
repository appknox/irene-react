import { akMT } from '@irene/translations/intl';
import { AkSkeleton } from '@irene/ui/ak-skeleton';

/*
  Every height here is the one the real control takes, so nothing moves when the
  form replaces this: the heading is 18px type, a label is 13px on a leading-none
  line, an input and a button are both h-9, and the terms box is size-4 beside
  14px type.
*/

/** One label above one control, as every field on this form is laid out. */
function FieldSkeleton() {
  return (
    <div className="grid gap-1.5">
      <AkSkeleton width="7rem" height="13px" />
      <AkSkeleton height="36px" />
    </div>
  );
}

/**
 * Holds the invitation form's shape while the invitation is read, so nothing
 * jumps when it arrives.
 */
export function RegisterInvitationFormSkeleton() {
  return (
    <div className="flex flex-col gap-3.5" aria-busy data-test-invite-form-skeleton>
      <span className="sr-only">{akMT('loading')}</span>

      {/* The heading, which arrives with the rest of the card. */}
      <AkSkeleton width="12rem" height="18px" className="mb-1.5" />

      {/* Email and company, which the invitation fills in. */}
      <FieldSkeleton />
      <FieldSkeleton />

      {/* First and last name, side by side. */}
      <div className="flex gap-3.5">
        <div className="flex-1">
          <FieldSkeleton />
        </div>

        <div className="flex-1">
          <FieldSkeleton />
        </div>
      </div>

      {/* Username, password and its confirmation. */}
      <FieldSkeleton />
      <FieldSkeleton />
      <FieldSkeleton />

      {/* The terms, which are a box beside a line of text rather than a field. */}
      <div className="flex items-center gap-2">
        <AkSkeleton width="16px" height="16px" />
        <AkSkeleton width="14rem" height="14px" />
      </div>

      <AkSkeleton height="36px" />
    </div>
  );
}

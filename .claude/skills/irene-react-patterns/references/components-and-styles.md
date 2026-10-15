# Components, styles, forms and copy

Read `CLAUDE.md` → Styling alongside this.

## App components

Named function exports, kebab-case files, the props interface right above the
component, `Readonly<Props>`, and a JSDoc saying what it's for.

- Build from `Ak*` components (`packages/ui/src/components/` has button,
  typography, input, select, checkbox, link, icon, alert, table, skeleton,
  modal, drawer, popover, menu, tooltip, chip, form…).
- Blank line between sibling JSX elements (lint). Logic longer than a few
  lines goes in a `use…` hook; pure helpers go in `utils.ts` with a test.
- Loading: an `AkSkeleton` shaped like the content, or `loading` on the
  button. Failures: `AkAlert` or `akNotify`.
- A feature rendered from outside exports its entry in `features/<f>/index.ts`.

## Design-system components (`packages/ui/src/components/ak-<name>/`)

Generic only, with no app data or API calls. Files: `index.tsx`
(`Ak<Name>…`), `variants.ts` (`cva`), `index.stories.tsx`
(`'Components/Ak<Name>'`, autodocs), `index.test.tsx`, plus
`helpers`/`context`/`styles.module.css` when needed.

```tsx
function AkBadge({
  className,
  color = 'neutral',
  ...props
}: ComponentProps<'span'> & VariantProps<typeof akBadgeVariants>) {
  return (
    <span
      data-slot="badge"
      data-color={color}
      className={cn(akBadgeVariants({ color }), className)}
      {...props}
    />
  );
}
```

- Extend the native element's props and spread the rest. Expose state as
  `data-*` and style from it (`data-loading:…`). Use Radix `Slot` for
  `asChild`. Use `compoundVariants` for variant × colour.
- Icons: `<AkIcon name="material-symbols:info" />`. SVGs:
  `import X from '@irene/ui/svgs/x.svg?react'`.
- **shadcn**: `pnpm --filter @irene/ui shadcn:add <name>`, never the bare
  CLI. It writes `ak-<name>/index.tsx`, renames exports to `Ak*`, splits `cva`
  into `variants.ts` and fixes imports. Then restyle with tokens, match irene's
  props, and add a story and tests. Check what already exists first.

## Styles

- Inline Tailwind classes with theme tokens (`bg-primary`,
  `text-foreground-disabled`, `rounded-md`). No hex, rgb, or arbitrary
  radius, spacing or text size (lint).
- The root font is 14px and spacing steps are 4px (`w-14` = 56px). Use at most
  two decimals (`py-2.75` works; `gap-4.375` generates nothing).
- Runtime values: `style={{ '--progress': `${pct}%` }} className="w-(--progress)"`.
- CSS Modules only for keyframes and complex selectors. No dark mode
  (`dark:`), and no styled-components or inline style objects.

### `cn` (`@irene/ui/cn` = clsx + tailwind-merge; last class wins)

- Put the component's own classes first and the caller's `className` last, so
  the caller overrides: `cn(akXVariants({ color }), isCompact && 'px-1', className)`.
- Use it when combining with conditions, variables, variants or props:
  `cn('rounded-full', isUnread && 'bg-secondary')`, or `{ 'opacity-50': disabled }`
  for several flags.
- **Class lists declared outside the JSX as constants** are wrapped in `cn()`,
  even single literals. The lint rules only read `className`, `cn()`/`cva()`
  and `*Props={{ className }}`, so a bare string would escape them.
  ```tsx
  const SEVERITY_DOT = { critical: cn('bg-danger'), low: cn('bg-success') } satisfies Record<
    Severity,
    string
  >;
  const CELL = cn('px-3 py-2.75 text-sm');
  ```
  Keep such constants in their own file and never export them. Shared styling
  belongs in a component or a `cva` variant. (`variants.ts` is exempt.)
- Don't use it for a single inline literal: `className="flex items-center"`.
- tailwind-merge already understands the theme (`text-2xs` and `text-md` vs
  colours, fractional spacing, semantic colours). Numbered shadows are
  registered via `SHADOW_SCALE`. **A new non-standard token name** needs
  registering in `cn/index.ts` plus a test, or merges break silently.

## Forms (react-hook-form + zod + AkForm)

**One schema file per form** (`features/<f>/schemas/<form>.ts`), exporting
three things:

```ts
/** Built per render, so its messages follow the locale. */
export const buildResetPasswordSchema = () =>
  z
    .object({
      password: z.string().min(1, akMT('enterNewPassword')),
      confirm_password: z.string().min(1, akMT('enterConfirmPassword')),
    })
    .refine((v) => v.password === v.confirm_password, {
      message: akMT('passwordMatchError'),
      path: ['confirm_password'],
    });

export type ResetPasswordFormSchema = z.infer<ReturnType<typeof buildResetPasswordSchema>>;
export const ResetPasswordFormField = createAkFormField<ResetPasswordFormSchema>(); // module scope
```

- **Builder functions, never constants** (`akMT` is read when called). They
  can take parameters (`buildStoreLinkSchema(isOffsec)`).
- Field names are the API's names, so values are the request body and API
  errors map back onto fields.
- **Why `XFormField` and not `AkFormField`:** a bare `AkFormField` falls back
  to the generic `FieldValues` type and accepts any string as `name`. A typo
  then compiles, registers a field the schema doesn't know, and **never
  validates**. `createAkFormField<XFormSchema>()` fixes the schema type once,
  so `name` autocompletes and a typo is a type error, without spelling out
  the generics on every field. Always use the bound field, never `AkFormField`
  directly.
- Create it **once, at module scope**, in the schema file. Each call returns
  a new component, so calling it during a render remounts the field on every
  render and loses what was typed.
- Patterns:
  - required text: `z.string().trim().min(1, akMT(…))`
  - must-tick checkbox: `.refine(Boolean, …)`
  - cross-field checks: `.refine` with a `path`
  - several messages for one field: `.superRefine` with `_validate…` helpers
  - multi-step forms: `.extend()` per step (login)

**The form**:

```tsx
const form = useForm<XFormSchema>({
  resolver: zodResolver(buildXSchema()),
  defaultValues: { username: '' },
  reValidateMode: 'onSubmit',
});
const usernameIsEmpty = useRequiredField<XFormSchema>('username', form);

<AkFormProvider {...form}>
  <form noValidate onSubmit={form.handleSubmit((v) => mutation.mutate(v))}>
    <XFormField name="username" label={akMT('usernameEmailIdTextLabel')}>
      <AkInput />
    </XFormField>

    <AkButton type="submit" loading={mutation.isPending} disabled={usernameIsEmpty}>
      …
    </AkButton>
  </form>
</AkFormProvider>;
```

- Every field gets a default value. The control is the field's **child**.
- `reValidateMode: 'onSubmit'` is the default. Use `'onChange'` for long forms
  and `mode: 'onChange'` only for live checks (store link).
- `useRequiredField` disables submit while required text is empty, and hides
  that field's "required" message.
- API errors: `toFormFieldErrors(schema, error)` → `setFormFieldErrors(form, …)`.
  If nothing matches, show a toast. For one known field,
  `getApiFieldErrors` + `form.setError` is fine.

**zod beyond forms**: route `validateSearch` (optional params, plus
`.catch(undefined)` on navigation values), and notification `context.ts`
schemas checked with `safeParse` before rendering. Fall back on failure. Types
always come from `z.infer`.

## Copy and translations

- Add every key to **both** `en.json` and `ja.json`. Search first: irene's keys
  exist. Nested ids use dots.
- **JSX children → `<AkMessageTranslate id="…" values={…} />`**. It's preferred
  for IntelliSense: `id` autocompletes and `values` is typed per message.
- **Everywhere else → `akMT('…', values)`**: props (`label`, `placeholder`,
  `aria-label`), zod messages, toasts, route titles, hooks and tests. It
  returns a string, or React nodes when the message has markup.
- Messages may contain `<b> <strong> <em> <code> <span> <br>` (`RICH_TEXT_TAGS`).
  Never use `dangerouslySetInnerHTML`.
- Never choose the id with a ternary: branch around the call,
  `cond ? akMT('a') : akMT('b')`.

### Dates, times and numbers

- Use the named `FORMATS` (`packages/translations/src/formats.ts`: `hhmmss`
  for date/time, `USD`/`EUR` for numbers). In a message:
  `"Last scanned at {at, time, hhmmss}"` with `values={{ at: new Date(…) }}`.
  Standalone: `useIntl().formatTime(v, { format: 'hhmmss' })` (or `getIntl()`
  outside React).
- Need another format? Add it to `FORMATS`. Never use `toLocaleString`, inline
  `Intl` options or pattern strings.
- Relative time: `formatRelativeTime` from `@/utils/relative-time`. dayjs is
  for parsing and arithmetic. If it must format, use
  `.locale(getLocale())` per call, never the global `dayjs.locale()`. (The
  fixed patterns in `notifications/utils.ts` are legacy and English-only.)
- Unreadable dates render as `''`, never "Invalid Date".

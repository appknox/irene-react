# Working in this repo with an AI assistant

Conventions an assistant cannot infer from the code, and that reviewers will
ask for. Claude Code reads this file automatically; paste it into whatever else
you use.

## Styling

**Write classes inline in `className`. Repeat them rather than share them.**
Two components that happen to use `size-5.25` each write `size-5.25`; do not
hoist it into a constant, and never export one for another module to import. A
shared constant couples modules that only look alike, and it moves the styling
away from the markup it applies to. Real sharing belongs in a component or a
`cva` variant, not in a class-name export.

**`cn()` is for merging, not for decoration.** A `className` that is one string
literal is written as one string literal — `className="flex items-center"`, not
`className={cn('flex items-center')}`. There is nothing to merge, so the
wrapper only adds noise and a call at render.

Reach for `cn()` when something actually has to be combined:

```tsx
<div className={cn('flex flex-col', spacing, className)} />
<span className={cn('size-2.75 rounded-full', severity.dot)} />
<button className={cn('rounded-full', isUnread && 'bg-secondary')} />
```

The same applies to a class list that cannot be inline at all — a variable, an
object value or a prop — where `cn()` keeps one path for every class list, so
tailwind-merge resolves conflicts and the lint rules that read `cn()` calls
catch a hardcoded radius, spacing or colour:

```ts
const LABEL_SIZE = { small: cn('text-sm'), medium: cn('text-base') };
```

Not `{ small: 'text-sm' }`. The exception is a `variants.ts`, where `cva`
already owns the strings.

**Use tokens, never raw values.** Colours, radii, shadows and spacing come from
`packages/ui/styles/theme.css`. Stylelint fails a hex, an `rgb()`, a numeric
radius or a pixel shadow. The spacing scale counts in 4px steps and the root
font size is 14px, so `rem` and the scale do not agree: `w-14` is 56px,
`3.5rem` is 49px.

**The spacing scale takes two decimal places, no more.** `py-2.75` and
`h-43.75` work; `gap-x-4.375` silently generates nothing — no error, no class,
no layout. A ported `1.25em` is 17.5px at a 14px root, which needs 4.375, so
round to the nearest step the scale has. An arbitrary value like
`gap-x-[1.25em]` builds but the lint rule rejects it. The rule covers padding,
margin, `gap` and `space-*` only — the rhythm. Sizes (`w`, `h`, `size`), limits
(`min-*`, `max-*`) and offsets (`inset`, `top`, `right`, `bottom`, `left`) take
an arbitrary value, because they are set against the viewport, the content or a
percentage: `max-h-[70vh]` is written inline rather than added to `@theme`,
which holds the design system rather than one layout's limit. When a converted
value needs three decimals, check the built CSS rather than trusting the class
name.

**Break long class lists up.** `eslint --fix` wraps them by variant group.

## TypeScript

No `@ts-ignore`, `@ts-expect-error`, `any`, `never`, non-null `!` or
`as unknown as`. Fix the type instead. Deriving from a generated type is
usually the answer — route paths come from `FileRouteTypes['to']`, not a
hand-written union.

Import through package paths (`@irene/ui/ak-button`, `@/components/side-nav`),
not relative walks.

## Comments and names

State what the code does and why, in one declarative sentence. Name the prop,
the endpoint, the flag or the condition. No comments that restate a class list
or a JSX structure; the code says it.

Test names state the behaviour: `leaves StoreKnox out of the list while a
StoreKnox page is open`, not `renders correctly`.

## Tests

Real scenarios through MSW, with factories for models. Coverage thresholds are
90% on all four columns and the run fails below them. A component test asserts
what a user sees, not the internals.

**Factories always use faker**, and take an `overrides` argument so a test can
pin the one field it is about. A data type with several shapes gets a builder
per shape rather than one object carrying every field — but shapes that type a
shared field differently must not compose, or the intersection collapses to
`never`.

**Assert against the generated values, not literals.** Render with the built
object and assert on it:

```ts
expect(element('version')).toHaveTextContent(`version: ${context.version}`);
```

Not `toHaveTextContent('version: 9.0.16')`. A test that hardcodes what the
factory generated passes for the wrong reason and breaks when the factory
changes.

## Porting from irene

`appknox/irene` is the source of truth, not the notes in `migration/`. Carry
every condition across; if a guard looks redundant, port it anyway and say so
in the comment. Deliberate differences go in `DESIGN-DECISIONS.md` before they
are noticed in review, and QA scenarios go in `QA-SCENARIOS.md` — MSW scenarios
are named in the URL as `?mock=<area>:<name>`.

## Configuration

Twelve keys are registered in `@irene/config`; adding one means updating the
deployment, so do not invent one. A value the build fixes and no deployment
overrides — a product version, a vendor's public key — belongs in
`@irene/config/product`, not in the key list.

## Browser storage

Every key is namespaced `irene:<name>` — `irene:auth-session`,
`irene:sidebar-state`, `irene:locale`. A key built from a value carries the
namespace too, as `irene:freshchat-restore-id:<hash>` does. The app shares an
origin with whatever else is served from it, so an unprefixed key is one
collision away from reading someone else's value.

## Commits

`VERB: one sentence`, no body, no co-author trailer. Commit only when asked.

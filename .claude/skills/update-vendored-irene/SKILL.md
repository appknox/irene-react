---
name: update-vendored-irene
description: Bring the vendored Ember app under apps/irene up to a newer irene release, keeping the embed and session plumbing this repo adds to it. Use when asked to pull the latest irene changes, update the vendored irene, or when apps/irene lags the irene repo.
---

# Update the vendored irene

`apps/irene` is a plain copy of the irene repository at a release, tracked in
this repo. It is not a submodule and has no `.git` of its own, so an update is a
file sync followed by re-applying what this repo adds to it.

**Six files are this repo's and must survive the sync.** Four more are
upstream's with a local change in each. Everything else is upstream's and is
replaced wholesale.

| This repo's own files                      | What they do                       |
| ------------------------------------------ | ---------------------------------- |
| `app/components/react-component/index.hbs` | The mount point a template renders |
| `app/components/react-component/index.ts`  | "                                  |
| `app/modifiers/react-component.ts`         | Mounts a React page on the element |
| `app/utils/react-embed.ts`                 | Loads the embed bundle at runtime  |
| `app/utils/react-session.ts`               | Keeps one session across both apps |
| `tests/unit/utils/react-session-test.js`   | Covers it                          |

| Upstream file with a local change                                 | The change                                                       |
| ----------------------------------------------------------------- | ---------------------------------------------------------------- |
| `app/authenticators/base.ts`                                      | Calls `syncReactSession` on authenticate, restore and invalidate |
| `app/routes/application.ts`                                       | Calls `adoptReactSession` on boot                                |
| `ember-cli-build.js`                                              | Excludes `assets/embed` from fingerprinting                      |
| `config/environment.js`                                           | Carries this repo's product version, which upstream does not     |
| `app/templates/authenticated/dashboard/organization.hbs`          | Mounts the React organization screen                             |
| `app/templates/.../organization-settings/integrations.hbs`        | Mounts the React integrations pane                               |
| `app/templates/.../organization-settings/ai-powered-features.hbs` | Mounts the React AI features pane                                |
| `app/routes/.../organization-settings/integrations.ts`            | Drops the GitHub request the React pane makes itself             |

---

## 1. Find the release to move to

The irene checkout sits beside this repo at `../irene`.

```
git -C ../irene fetch
git -C ../irene log origin/master --oneline -5
grep '"version"' apps/irene/package.json
```

Sync from the newest release on `origin/master`, not from the newest tag — irene
tags lag its releases, so the version in `package.json` on `master` is ahead of
`git tag` and is the one to read. Stop and say so if the vendored copy is already
on it. Everything below that names a tag takes a commit just as well.

## 2. Record what is local

```
for f in app/authenticators/base.ts app/routes/application.ts \
         config/environment.js ember-cli-build.js \
         app/templates/authenticated/dashboard/organization.hbs \
         app/templates/authenticated/dashboard/organization-settings/integrations.hbs \
         app/templates/authenticated/dashboard/organization-settings/ai-powered-features.hbs \
         app/routes/authenticated/dashboard/organization-settings/integrations.ts; do
  git -C ../irene show "<current-tag>:$f" | diff - "apps/irene/$f" > "/tmp/irene-$(basename $f).patch"
done
```

A diff that is empty means the change left upstream — drop that row from the
table above in the same commit.

## 3. Sync the tree

```
git -C ../irene archive <new-tag> | tar -x -C apps/irene
```

`tar` writes only what the archive holds, so the six local files are untouched
and the four patched files are reset to upstream.

## 4. Re-apply the local changes

Re-apply each saved patch to its file. Read the result rather than trusting the
patch: upstream may have moved the code it hooks into.

```
git -C ../irene show "<new-tag>:app/authenticators/base.ts" | diff - apps/irene/app/authenticators/base.ts
```

Each must show its change and nothing else. A mount is one `<ReactComponent>`
around the Ember component it replaced, so a template upstream has rewritten
needs the mount put back by hand rather than patched.

## 5. Check what the sync brought

```
git status --porcelain apps/irene | head -40
git diff --stat apps/irene | tail -5
```

A deleted upstream file is not removed by `tar` — delete any file the new tag no
longer holds. An untracked file that is neither upstream's nor one of the six is
drift: read it before keeping it.

## 6. Verify

```
pnpm install
pnpm build:embed
pnpm --filter @irene/dashboard test
(cd apps/irene && ESLINT_USE_FLAT_CONFIG=false npx eslint .)
```

`npm run lint:js` reports every file as ignored: ESLint 8.57 walks up to the
monorepo's `eslint.config.js`, which ignores `apps/irene/**`. The env var pins it
to the vendored app's own `.eslintrc.js`. Errors in files the sync did not touch
are upstream's — compare against `../irene` before chasing one.

Then start both apps and sign in, which is what the session plumbing serves:

```
pnpm start-both
```

## 7. Commit

One commit, naming both versions:

```
MODIFY: Update the vendored irene to <new-tag>, keeping the embed and session plumbing.
```

/**
 * Normalise what the shadcn CLI writes into packages/ui. Run after every add.
 *
 * Three jobs:
 *
 * 1. Naming. Shared components carry an `ak-` prefix and an `Ak` export, so an
 *    Appknox component is distinguishable from a bare HTML element or a
 *    third-party one at the call site.
 *
 * 2. Layout. The CLI writes one flat file that exports both the component and
 *    its cva variants. A file exporting a non-component breaks Fast Refresh —
 *    editing it reloads the page instead of swapping the component. So:
 *
 *      ak-button/index.tsx      the components, and nothing else
 *      ak-button/variants.ts    the cva calls
 *
 * 3. Imports. The CLI reaches for its own `cn` package and for `@/` aliases
 *    that point at an app. Components import through the package name, so no
 *    alias plumbing is needed anywhere.
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const componentsDir = fileURLToPath(new URL('../src/components/', import.meta.url));
const incomingDir = join(componentsDir, 'ui');

const importRewrites: [RegExp, string][] = [
  [/import \{ cn \} from ["']cn["'];?/g, "import { cn } from '@irene/ui/cn';"],
  [/from ["']@\/lib\/utils["']/g, "from '@irene/ui/cn'"],
  [/from ["']@\/components\/ui\/([\w-]+)["']/g, "from '@irene/ui/ak-$1'"],
];

const rewriteImports = (source: string) =>
  importRewrites.reduce((text, [from, to]) => text.replace(from, to), source);

/** Button -> AkButton, buttonVariants -> akButtonVariants. */
const prefixed = (name: string) =>
  /^[A-Z]/.test(name) ? `Ak${name}` : `ak${name[0].toUpperCase()}${name.slice(1)}`;

/** Every identifier the file exports, in declaration order. */
function exportedNames(source: string): string[] {
  const block = new RegExp(/export \{([^}]*)\}/).exec(source);

  return block
    ? block[1]
        .split(',')
        .map((part) => part.trim())
        .filter(Boolean)
    : [];
}

/** Pull top-level `const xVariants = cva(...)` blocks out of a component file. */
function splitVariants(source: string) {
  const blocks = [...source.matchAll(/^const (\w+Variants) = cva\([\s\S]*?\n\);$/gm)];

  if (blocks.length === 0) {
    return { names: [], body: '', rest: source };
  }

  const rest = blocks
    .reduce((text, [block]) => text.replace(block, ''), source)
    .replace(/^import \{ cva, type VariantProps \} from ['"]class-variance-authority['"];?\n/m, '')
    .replace(/\n{3,}/g, '\n\n');

  return {
    names: blocks.map(([, name]) => name),
    body: blocks.map(([block]) => `export ${block}`).join('\n\n'),
    rest,
  };
}

// The CLI creates this directory only while adding; nothing to do otherwise.
if (!existsSync(incomingDir)) {
  process.stdout.write('nothing to restructure\n');
  process.exit(0);
}

let handled = 0;

for (const entry of readdirSync(incomingDir, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith('.tsx')) {
    continue;
  }

  const base = entry.name.replace(/\.tsx$/, '');
  const flatPath = join(incomingDir, entry.name);
  const folder = join(componentsDir, `ak-${base}`);

  let source = rewriteImports(readFileSync(flatPath, 'utf8'));

  // Rename every exported identifier. Matching whole identifiers and looking
  // each one up means DialogTrigger is not caught by the rule for Dialog.
  const renames = new Map(exportedNames(source).map((name) => [name, prefixed(name)]));

  source = source.replace(
    /\b[A-Za-z_$][\w$]*\b/g,
    (identifier: string) => renames.get(identifier) ?? identifier
  );

  const variants = splitVariants(source);

  mkdirSync(folder, { recursive: true });

  if (variants.names.length > 0) {
    writeFileSync(
      join(folder, 'variants.ts'),
      `import { cva } from 'class-variance-authority';\n\n${variants.body}\n`
    );

    const component = variants.rest
      .replace(
        /^(import \* as React[^\n]*\n)/m,
        `$1import { type VariantProps } from 'class-variance-authority';\n`
      )
      .replace(
        /^(import \{ cn \}[^\n]*\n)/m,
        `$1import { ${variants.names.join(', ')} } from './variants';\n`
      )
      .replace(/export \{([^}]*)\}/, (_, exported) => {
        const kept = exported
          .split(',')
          .map((part: string) => part.trim())
          .filter((part: string) => part && !variants.names.includes(part));

        return `export { ${kept.join(', ')} }`;
      });

    writeFileSync(join(folder, 'index.tsx'), component);
  } else {
    writeFileSync(join(folder, 'index.tsx'), variants.rest);
  }

  rmSync(flatPath);
  handled += 1;
}

// The CLI recreates this directory on every add; it is a staging area only.
rmSync(incomingDir, { recursive: true, force: true });

process.stdout.write(
  handled === 0 ? 'nothing to restructure\n' : `restructured ${handled} component(s)\n`
);

import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const componentsDir = fileURLToPath(new URL('../src/components/', import.meta.url));

/** Button -> AkButton, buttonVariants -> akButtonVariants. */
const prefixed = (name: string) =>
  /^[A-Z]/.test(name) ? `Ak${name}` : `ak${name[0].toUpperCase()}${name.slice(1)}`;

const splitList = (names: string) =>
  names
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean);

const IMPORT_REWRITES: [RegExp, string][] = [
  // The directive only means something to a React Server Components build.
  [/^'use client';?\n+/m, ''],
  [/import \{ cn \} from ["']cn["'];?/g, "import { cn } from '@irene/ui/cn';"],
  [/from ["']@\/lib\/utils["']/g, "from '@irene/ui/cn'"],
  [/from ["']@\/components\/ui\/([\w-]+)["']/g, "from '@irene/ui/ak-$1'"],
];

const CVA_BLOCK = /^const (\w+Variants) = cva\([\s\S]*?\n\);?$/gm;

/**
 * Normalise what the shadcn CLI writes into packages/ui. Run after every add.
 *
 * Renames exports to the `ak-` convention, splits cva blocks into variants.ts
 * so Fast Refresh keeps working, and repoints the CLI's `@/` aliases at the
 * package.
 */
class ShadcnComponentRewriter {
  private source: string;
  private readonly name: string;
  private readonly folder: string;
  private readonly renames = new Map<string, string>();
  private readonly flatPath: string;

  constructor(flatPath: string) {
    this.flatPath = flatPath;
    this.source = readFileSync(flatPath, 'utf8');
    this.name = basename(flatPath, '.tsx');
    this.folder = join(componentsDir, `ak-${this.name}`);
  }

  restructure() {
    this.rewriteImports();
    this.rewriteSiblingImports();
    this.collectRenames();
    this.applyRenames();
    this.write();

    rmSync(this.flatPath);
  }

  private rewriteImports() {
    this.source = IMPORT_REWRITES.reduce((text, [from, to]) => text.replace(from, to), this.source);
  }

  /**
   * The CLI points siblings at '@irene/ui/ui/<name>', a staging path that does
   * not survive restructuring, and imports the CLI's names rather than the ak-
   * ones those components export. Fix both, and record the renames so their use
   * sites follow.
   */
  private rewriteSiblingImports() {
    this.source = this.source.replace(
      /import \{([^}]*)\} from ['"]@irene\/ui\/ui\/([\w-]+)['"];?/g,
      (_, names: string, component: string) => {
        const imported = splitList(names).map((name) => {
          this.renames.set(name, prefixed(name));

          return prefixed(name);
        });

        return `import { ${imported.join(', ')} } from '@irene/ui/ak-${component}';`;
      }
    );
  }

  /**
   * Exported names plus the cva consts — the split makes those public through
   * the variants entry even when shadcn keeps them file-local.
   */
  private collectRenames() {
    const exported = /export \{([^}]*)\}/.exec(this.source);

    for (const name of [...(exported ? splitList(exported[1]) : []), ...this.variantNames()]) {
      this.renames.set(name, prefixed(name));
    }
  }

  private variantNames() {
    return [...this.source.matchAll(CVA_BLOCK)].map(([, name]) => name);
  }

  /**
   * Imports are masked while renaming. They name things owned by other
   * packages — `import { Select } from 'radix-ui'` must stay Select. Matching
   * whole identifiers means DialogTrigger escapes the rule for Dialog.
   */
  private applyRenames() {
    const imports: string[] = [];

    this.source = this.source
      .replace(/^import [\s\S]*?from ['"][^'"]*['"];?$/gm, (statement) => {
        imports.push(statement);

        return `/*__IMPORT_${imports.length - 1}__*/`;
      })
      .replace(/\b[A-Za-z_$][\w$]*\b/g, (identifier) => this.renames.get(identifier) ?? identifier)
      .replace(/\/\*__IMPORT_(\d+)__\*\//g, (_, index) => imports[Number(index)]);
  }

  private write() {
    mkdirSync(this.folder, { recursive: true });

    const blocks = [...this.source.matchAll(CVA_BLOCK)];

    if (blocks.length === 0) {
      writeFileSync(join(this.folder, 'index.tsx'), this.source);

      return;
    }

    const names = blocks.map(([, name]) => name);
    const body = blocks.map(([block]) => `export ${block}`).join('\n\n');

    writeFileSync(
      join(this.folder, 'variants.ts'),
      `import { cva } from 'class-variance-authority';\n\n${body}\n`
    );

    writeFileSync(join(this.folder, 'index.tsx'), this.componentWithout(blocks, names));
  }

  private componentWithout(blocks: RegExpExecArray[], names: string[]) {
    return blocks
      .reduce((text, [block]) => text.replace(block, ''), this.source)
      .replace(
        /^import \{ cva, type VariantProps \} from ['"]class-variance-authority['"];?\n/m,
        ''
      )
      .replace(/\n{3,}/g, '\n\n')
      .replace(
        /^(import \* as React[^\n]*\n)/m,
        `$1import { type VariantProps } from 'class-variance-authority';\n`
      )
      .replace(
        /^(import \{ cn \}[^\n]*\n)/m,
        `$1import { ${names.join(', ')} } from '@irene/ui/ak-${this.name}/variants';\n`
      )
      .replace(
        /export \{([^}]*)\}/,
        (_, exported: string) =>
          `export { ${splitList(exported)
            .filter((part) => !names.includes(part))
            .join(', ')} }`
      );
  }

  /**
   * The CLI resolves the `ui` alias through tsconfig paths and the directory it
   * picks has moved between versions, so collect every flat .tsx not already in
   * a component folder rather than hard-coding one.
   */
  static staged(dir: string = componentsDir): string[] {
    const found: string[] = [];

    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name);

      if (entry.isDirectory()) {
        if (!entry.name.startsWith('ak-')) {
          found.push(...ShadcnComponentRewriter.staged(path));
        }

        continue;
      }

      if (entry.name.endsWith('.tsx') && !entry.name.startsWith('index.')) {
        found.push(path);
      }
    }

    return found;
  }

  /** Restructure every staged file. Returns how many were handled. */
  static restructureAll(): number {
    const staged = ShadcnComponentRewriter.staged();

    for (const flatPath of staged) {
      new ShadcnComponentRewriter(flatPath).restructure();
    }

    return staged.length;
  }
}

const handled = ShadcnComponentRewriter.restructureAll();

// What is left under src/components/ui is an empty staging area.
rmSync(join(componentsDir, 'ui'), { recursive: true, force: true });

process.stdout.write(
  handled === 0 ? 'nothing to restructure\n' : `restructured ${handled} component(s)\n`
);

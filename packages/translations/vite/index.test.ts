// @vitest-environment node
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { build, createServer, type ViteDevServer } from 'vite';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { translationsPlugin } from './index.ts';
import type { GenerateOptions } from '../scripts/utils/generate-messages.ts';

// File watching can take a moment on a busy machine.
const WATCH = { timeout: 5000 };

let root: string;
let options: GenerateOptions;
let server: ViteDevServer | undefined;

const writeLocale = (locale: string, content: unknown) =>
  writeFileSync(join(options.translationsDir, `${locale}.json`), JSON.stringify(content));

const readGenerated = (locale: string) =>
  JSON.parse(readFileSync(join(options.generatedDir, `${locale}.json`), 'utf8'));

const writeValidLocales = () => {
  writeLocale('en', { login: 'Login' });
  writeLocale('ja', { login: 'ログイン' });
};

/** Starts a dev server with the plugin and waits for its startup generation. */
async function startDevServer() {
  server = await createServer({
    root,
    configFile: false,
    logLevel: 'silent',
    server: { middlewareMode: true },
    plugins: [translationsPlugin(options)],
  });

  await server.pluginContainer.buildStart({});

  return server;
}

/**
 * Saves a translation file until the dev server reacts. A save made before its watcher is ready goes unnoticed, so one save is not enough.
 *
 * @param locale - The file to save.
 * @param content - What to save.
 * @param assertion - Passes once the dev server has reacted.
 */
const saveUntil = (locale: string, content: unknown, assertion: () => void) =>
  vi.waitFor(() => {
    writeLocale(locale, content);
    assertion();
  }, WATCH);

/** Builds a one-file library with the plugin. */
const buildWithPlugin = () =>
  build({
    root,
    configFile: false,
    logLevel: 'silent',
    plugins: [translationsPlugin(options)],
    build: {
      outDir: join(root, 'dist'),
      lib: { entry: join(root, 'entry.js'), formats: ['es'] },
    },
  });

beforeEach(() => {
  root = mkdtempSync(join(tmpdir(), 'translations-plugin-'));
  options = { translationsDir: join(root, 'translations'), generatedDir: join(root, 'generated') };

  mkdirSync(options.translationsDir);
  writeFileSync(join(root, 'entry.js'), 'export const entry = 1;\n');
});

afterEach(async () => {
  await server?.close();
  server = undefined;
  rmSync(root, { recursive: true, force: true });
});

describe('translationsPlugin', () => {
  describe('in a build', () => {
    it('generates the flat files before bundling', async () => {
      writeValidLocales();

      await buildWithPlugin();

      expect(readGenerated('en')).toEqual({ login: 'Login' });
    });

    it('stops the build on an unsupported tag and says how to fix it', async () => {
      writeLocale('en', { link: 'Read <a>the docs</a>' });
      writeLocale('ja', { link: '<a>ドキュメント</a>を読む' });

      await expect(buildWithPlugin()).rejects.toThrow(
        /uses <a>, which has no renderer[\s\S]*RICH_TEXT_TAGS/
      );
    });

    it('stops the build when the translations are invalid', async () => {
      writeLocale('en', { login: 'Login', next: 'Next' });
      writeLocale('ja', { login: 'ログイン' });

      await expect(buildWithPlugin()).rejects.toThrow('ja: "next" is missing');
    });
  });

  describe('in the dev server', () => {
    it('generates the flat files on startup', async () => {
      writeValidLocales();

      await startDevServer();

      expect(readGenerated('ja')).toEqual({ login: 'ログイン' });
    });

    it('keeps running when the translations are invalid at startup', async () => {
      writeLocale('en', { login: 'Login', next: 'Next' });
      writeLocale('ja', { login: 'ログイン' });

      await expect(startDevServer()).resolves.toBeDefined();
    });

    it('regenerates when a translation file changes', async () => {
      writeValidLocales();
      await startDevServer();

      await saveUntil('en', { login: 'Sign in' }, () =>
        expect(readGenerated('en')).toEqual({ login: 'Sign in' })
      );
    });

    it('shows the problems in the overlay and keeps the last good files', async () => {
      writeValidLocales();
      const devServer = await startDevServer();
      const send = vi.spyOn(devServer.ws, 'send');

      await saveUntil('ja', { login: 'ログイン {oops' }, () =>
        expect(send).toHaveBeenCalledWith({
          type: 'error',
          err: expect.objectContaining({
            plugin: 'irene-translations',
            message: expect.stringContaining('ja: "login" does not parse'),
          }),
        })
      );

      expect(readGenerated('ja')).toEqual({ login: 'ログイン' });
    });

    it('shows an unsupported tag in the overlay with how to fix it', async () => {
      writeValidLocales();
      const devServer = await startDevServer();
      const send = vi.spyOn(devServer.ws, 'send');

      await saveUntil('ja', { login: '<a>ログイン</a>' }, () =>
        expect(send).toHaveBeenCalledWith({
          type: 'error',
          err: expect.objectContaining({
            message: expect.stringMatching(/ja: "login" uses <a>[\s\S]*RICH_TEXT_TAG_NAMES/),
          }),
        })
      );
    });

    it('reloads the page once the problems are fixed, clearing the overlay', async () => {
      writeValidLocales();
      const devServer = await startDevServer();
      const send = vi.spyOn(devServer.ws, 'send');

      await saveUntil('ja', { login: 'ログイン {oops' }, () =>
        expect(send).toHaveBeenCalledWith(expect.objectContaining({ type: 'error' }))
      );

      await saveUntil('ja', { login: 'ログイン' }, () =>
        expect(send).toHaveBeenCalledWith({ type: 'full-reload' })
      );
    });

    it('does not reload after a valid change when nothing was broken', async () => {
      writeValidLocales();
      const devServer = await startDevServer();
      const send = vi.spyOn(devServer.ws, 'send');

      await saveUntil('en', { login: 'Sign in' }, () =>
        expect(readGenerated('en')).toEqual({ login: 'Sign in' })
      );

      expect(send).not.toHaveBeenCalledWith({ type: 'full-reload' });
    });

    it('ignores files outside the translations folder', async () => {
      writeValidLocales();
      const devServer = await startDevServer();
      const send = vi.spyOn(devServer.ws, 'send');

      writeLocale('ja', { login: 'ログイン {oops' });
      devServer.watcher.emit('change', join(root, 'entry.js'));

      expect(send).not.toHaveBeenCalled();
    });
  });
});

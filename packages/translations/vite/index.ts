import { resolve, sep } from 'node:path';
import type { Plugin, ViteDevServer } from 'vite';

import {
  DEFAULT_GENERATE_OPTIONS,
  formatProblems,
  generateMessages,
  type GenerateOptions,
} from '../scripts/utils/generate-messages.ts';

const PLUGIN_NAME = 'irene-translations';

/** What the dev server last found, so a newly connected browser sees it too. */
interface WatchState {
  problems: string[];
}

/**
 * Sends the current problems to the browser's error overlay.
 *
 * @param server - The dev server.
 * @param state - The latest problems.
 */
function _showOverlay(server: ViteDevServer, state: WatchState) {
  server.ws.send({
    type: 'error',
    err: { message: formatProblems(state.problems), stack: '', plugin: PLUGIN_NAME },
  });
}

/**
 * Regenerates on every change to a translation file: reloads on success, shows the overlay on failure.
 *
 * @param server - The dev server.
 * @param options - The source and output folders.
 * @param state - The latest problems, shared with startup.
 */
function _watchTranslations(server: ViteDevServer, options: GenerateOptions, state: WatchState) {
  const translationsDir = resolve(options.translationsDir) + sep;

  const onFileEvent = (file: string) => {
    if (!file.startsWith(translationsDir) || !file.endsWith('.json')) {
      return;
    }

    const hadProblems = state.problems.length > 0;

    state.problems = generateMessages(options);

    if (state.problems.length > 0) {
      server.config.logger.error(formatProblems(state.problems), { timestamp: true });
      _showOverlay(server, state);

      return;
    }

    server.config.logger.info('translations regenerated', { timestamp: true });

    // Fixed files can match the last good output, which triggers no update, so reload to clear the overlay.
    if (hadProblems) {
      server.ws.send({ type: 'full-reload' });
    }
  };

  server.watcher.add(translationsDir);
  server.watcher.on('add', onFileEvent);
  server.watcher.on('change', onFileEvent);

  server.ws.on('connection', () => {
    if (state.problems.length > 0) {
      _showOverlay(server, state);
    }
  });
}

/**
 * Generates the flat message files when Vite starts and, in dev, again whenever a translation file changes.
 * A build stops on invalid translations; the dev server keeps running and shows them in the error overlay.
 *
 * @param options - The source and output folders. Defaults to this package's own.
 * @returns The Vite plugin.
 */
export function translationsPlugin(options: GenerateOptions = DEFAULT_GENERATE_OPTIONS): Plugin {
  const state: WatchState = { problems: [] };
  let isDevServer = false;

  return {
    name: PLUGIN_NAME,

    configResolved(config) {
      isDevServer = config.command === 'serve';
    },

    buildStart() {
      state.problems = generateMessages(options);

      if (state.problems.length === 0) {
        return;
      }

      if (isDevServer) {
        this.warn(formatProblems(state.problems));

        return;
      }

      this.error(formatProblems(state.problems));
    },

    configureServer(server) {
      _watchTranslations(server, options, state);
    },
  };
}

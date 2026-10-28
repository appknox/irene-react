import Route from '@ember/routing/route';
import { service } from '@ember/service';
import { all } from 'rsvp';
import type IntlService from 'ember-intl/services/intl';

import type { SessionService } from 'irene/adapters/auth-base';
import type ConfigurationService from 'irene/services/configuration';
import type WhitelabelService from 'irene/services/whitelabel';
import type AnalyticsService from 'irene/services/analytics';
import ENV from 'irene/config/environment';
import type LoggerService from 'irene/services/logger';
import { prefetchIrenePage } from '@irene/dashboard/embed';

import { adoptReactSession } from 'irene/utils/react-session';
import { isReactPage } from 'irene/utils/react-pages';
import { sharedResponses } from 'irene/utils/react-responses';

interface HeadDataService {
  title: string;
  favicon: string;
}

export default class ApplicationRoute extends Route {
  @service declare headData: HeadDataService;
  @service declare intl: IntlService;
  @service declare whitelabel: WhitelabelService;
  @service declare configuration: ConfigurationService;
  @service declare analytics: AnalyticsService;
  @service declare session: SessionService;
  @service declare logger: LoggerService;

  /**
   * This app's resolved configuration, for the React side to read instead of
   * the values its own build would have frozen in.
   *
   * @returns Every configuration key this deployment actually set.
   */
  reactConfig(): Record<string, string> {
    return Object.fromEntries(
      Object.entries(ENV.ENVHandlerCONST.processENV).filter(
        (entry): entry is [string, string] => typeof entry[1] === 'string'
      )
    );
  }

  async beforeModel(): Promise<void> {
    /* A migrated sign-in page authenticates on the React side, writing only its own entry. */
    adoptReactSession();

    /*
      A React page cannot start loading until this app has finished and
      rendered the element it mounts into. Started here, the two sets of
      requests overlap instead of running one after the other.
    */
    if (isReactPage(window.location.pathname)) {
      prefetchIrenePage({
        config: this.reactConfig(),
        responses: sharedResponses(),
      });
    }

    try {
      await this.session.setup();
    } catch (error) {
      this.logger.error('Failed to setup session', error);
    }

    // Fetch server and frontend configuration
    await all([
      this.configuration.serverConfigFetch(),
      this.configuration.getFrontendConfig(),
    ]);

    try {
      this.analytics.initializePosthog();
    } catch (error) {
      this.logger.error('Failed to initialize PostHog', error);
    }

    return this.intl.setLocale(['en']);
  }

  afterModel(): void {
    this.headData.title = this.whitelabel.name;
    this.headData.favicon = this.whitelabel.favicon;
  }

  model() {
    return {
      body_classes: `theme-${this.whitelabel.theme}`,
    };
  }
}

// @ts-expect-error no type defs
import SwaggerUI from 'swagger-ui';
import Component from '@glimmer/component';
import { action } from '@ember/object';

import { type SwaggerUIDataProps } from '..';

interface PublicApiDocsApiEndpointsSignature {
  Args: {
    data: SwaggerUIDataProps;
  };
}

export default class PublicApiDocsApiEndpointsComponent extends Component<PublicApiDocsApiEndpointsSignature> {
  /*
    Only the `apis` preset. The standalone preset is a separate entry point of
    the package and is undefined here, and it draws a top bar for choosing a
    spec that this page has no use for: the spec is passed in.
  */
  @action
  initializeAPIEndpoints(element: HTMLDivElement) {
    const servers = this.args.data.servers;

    SwaggerUI({
      spec: { ...this.args.data, info: {}, servers },
      domNode: element,
      presets: [SwaggerUI.presets.apis],
    });
  }
}

declare module '@glint/environment-ember-loose/registry' {
  export default interface Registry {
    'public-api-docs/api-endpoints': typeof PublicApiDocsApiEndpointsComponent;
  }
}

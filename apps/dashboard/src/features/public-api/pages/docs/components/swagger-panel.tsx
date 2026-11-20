import SwaggerUI from 'swagger-ui-react';

import type { ApiOpenApiSchema } from '@irene/api/services/public-api';

import './swagger-panel.css';
import 'swagger-ui-react/swagger-ui.css';

interface SwaggerPanelProps {
  spec: ApiOpenApiSchema;
  className: string;
}

/**
 * Renders one part of the OpenAPI document with Swagger UI.
 *
 * Swagger UI renders a document whole, so a part is shown by handing it the
 * document with the rest emptied and then hiding what it still draws. Which
 * part to keep is decided by `className`, since the rules that do the hiding
 * are written against the container around it.
 *
 * Swagger UI's own stylesheet is imported here rather than at the application
 * root: it is megabytes of global CSS, and this is the only screen that wants
 * it, so it arrives with this chunk and not before.
 *
 * @param props.spec - The document to render.
 * @param props.className - The container class naming which part to keep.
 */
export function SwaggerPanel({ spec, className }: Readonly<SwaggerPanelProps>) {
  return (
    <div className={className}>
      <SwaggerUI spec={spec} />
    </div>
  );
}

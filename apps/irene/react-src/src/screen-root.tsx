import { QueryClientProvider } from '@tanstack/react-query';
import { createElement, type ComponentType } from 'react';

import { queryClient } from './api';

/**
 * Everything a screen needs around it, wherever the host renders one.
 *
 * One cache for all of them, so two screens never read the same thing twice
 * and a screen reopened within the stale window shows at once.
 *
 * @param props.screen - The screen to render.
 */
export function ScreenRoot({ screen }: Readonly<{ screen: ComponentType }>) {
  return <QueryClientProvider client={queryClient}>{createElement(screen)}</QueryClientProvider>;
}

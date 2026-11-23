import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { renderWithProviders } from '@tests/render';

import { DiscoverSkeleton } from './discover-skeleton';

describe('discovery’s placeholder', () => {
  it('tells a screen reader discovery is loading', () => {
    renderWithProviders(<DiscoverSkeleton />);

    expect(screen.getByText(akMT('loading')).closest('[aria-busy]')).toHaveAttribute(
      'data-test-sk-discover-skeleton'
    );
  });
});

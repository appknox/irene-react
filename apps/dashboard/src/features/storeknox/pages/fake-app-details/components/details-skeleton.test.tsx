import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import { renderWithProviders } from '@tests/render';

import { DetailsSkeleton } from './details-skeleton';

describe('the fake-app details placeholder', () => {
  it('tells a screen reader the details are loading', () => {
    renderWithProviders(<DetailsSkeleton />);

    expect(screen.getByText(akMT('loading')).closest('[aria-busy]')).toHaveAttribute(
      'data-test-sk-fake-app-details-skeleton'
    );
  });

  it('holds a place for the header, six findings cards and the original app’s panel', () => {
    const { container } = renderWithProviders(<DetailsSkeleton />);

    expect(
      container.querySelectorAll('[data-test-sk-fake-app-details-skeleton-header]')
    ).toHaveLength(1);

    expect(
      container.querySelectorAll('[data-test-sk-fake-app-details-skeleton-finding]')
    ).toHaveLength(6);

    expect(
      container.querySelectorAll('[data-test-sk-fake-app-details-skeleton-original-app]')
    ).toHaveLength(1);
  });
});

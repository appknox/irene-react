import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';
import SecurityCover from '@irene/ui/svgs/security-bg-img.svg?react';
import SecurityIndicator from '@irene/ui/svgs/security-indicator.svg?react';

import { renderWithProviders } from '@tests/render';

import { ProductFeatureCard } from './product-feature-card';

/** The card for a product served separately, which is the only kind that links out. */
const renderSeparatelyServedCard = (opensInNewTab?: boolean) =>
  renderWithProviders(
    <ProductFeatureCard
      title="Security"
      description="Findings across the estate"
      destination={{ kind: 'app', href: '/security/projects' }}
      cover={SecurityCover}
      indicator={SecurityIndicator}
      opensInNewTab={opensInNewTab}
    />
  );

describe('ProductFeatureCard', () => {
  it('renders the link without target or rel when opensInNewTab is unset', () => {
    renderSeparatelyServedCard();

    const link = screen.getByRole('link', { name: akMT('takeMeToDashboard') });

    expect(link).toHaveAttribute('href', '/security/projects');
    expect(link).not.toHaveAttribute('target');
    expect(link).not.toHaveAttribute('rel');
  });

  it('renders the link with target _blank and rel noopener noreferrer when opensInNewTab is true', () => {
    renderSeparatelyServedCard(true);

    const link = screen.getByRole('link', { name: akMT('takeMeToDashboard') });

    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });
});

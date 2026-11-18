import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { EmbedProviders } from './providers';

describe('EmbedProviders', () => {
  it('renders what it is given', () => {
    render(
      <EmbedProviders>
        <p>embedded</p>
      </EmbedProviders>
    );

    expect(screen.getByText('embedded')).toBeInTheDocument();
  });

  it('brings the toaster, so a screen can report without the host wiring one', () => {
    render(
      <EmbedProviders>
        <p>embedded</p>
      </EmbedProviders>
    );

    /* It portals into the document, outside the element this app was given. */
    expect(document.querySelector('section[aria-label*="Notifications"]')).not.toBeNull();
  });
});

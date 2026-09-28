import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AkTooltip } from '@irene/ui/ak-tooltip';

describe('AkTooltip', () => {
  it('names the trigger once the pointer rests on it', async () => {
    render(
      <AkTooltip title="All projects">
        <button type="button">Open</button>
      </AkTooltip>
    );

    await userEvent.hover(screen.getByRole('button', { name: 'Open' }));

    expect(await screen.findByRole('tooltip')).toHaveTextContent('All projects');
  });

  it('says nothing until then, so it does not read as part of the page', () => {
    render(
      <AkTooltip title="All projects">
        <button type="button">Open</button>
      </AkTooltip>
    );

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('renders the trigger alone when disabled, for a label already on screen', async () => {
    render(
      <AkTooltip title="All projects" disabled>
        <button type="button">Open</button>
      </AkTooltip>
    );

    await userEvent.hover(screen.getByRole('button', { name: 'Open' }));

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('draws a pointer at the trigger when asked', async () => {
    render(
      <AkTooltip title="All projects" arrow>
        <button type="button">Open</button>
      </AkTooltip>
    );

    await userEvent.hover(screen.getByRole('button', { name: 'Open' }));
    await screen.findByRole('tooltip');

    await waitFor(() =>
      expect(document.querySelector('[data-slot="tooltip-arrow"]')).toBeInTheDocument()
    );
  });

  it('draws on the light surface when asked for one', async () => {
    render(
      <AkTooltip title="All projects" color="light">
        <button type="button">Open</button>
      </AkTooltip>
    );

    await userEvent.hover(screen.getByRole('button', { name: 'Open' }));

    expect(await screen.findByRole('tooltip')).toHaveClass('bg-background');
  });
});

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkAccordion } from '@irene/ui/ak-accordion';

describe('AkAccordion', () => {
  it('starts shut, its summary a button that says so', () => {
    render(<AkAccordion summaryText="Overview">Details</AkAccordion>);

    expect(screen.getByRole('button', { name: 'Overview' })).toHaveAttribute(
      'aria-expanded',
      'false'
    );

    expect(screen.queryByText('Details')).not.toBeInTheDocument();
  });

  it('opens on its summary and reports the new state', async () => {
    const onExpandedChange = vi.fn();

    render(
      <AkAccordion summaryText="Overview" onExpandedChange={onExpandedChange}>
        Details
      </AkAccordion>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Overview' }));

    expect(screen.getByText('Details')).toBeVisible();
    expect(onExpandedChange).toHaveBeenCalledWith(true);
  });

  it('follows the state it is given rather than its own', async () => {
    render(
      <AkAccordion summaryText="Overview" isExpanded={false} onExpandedChange={vi.fn()}>
        Details
      </AkAccordion>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Overview' }));

    expect(screen.queryByText('Details')).not.toBeInTheDocument();
  });

  it('opens on mount when asked to', () => {
    render(
      <AkAccordion summaryText="Overview" defaultExpanded>
        Details
      </AkAccordion>
    );

    expect(screen.getByText('Details')).toBeVisible();
  });

  it('stays shut while disabled', async () => {
    render(
      <AkAccordion summaryText="Overview" disabled>
        Details
      </AkAccordion>
    );

    await userEvent.click(screen.getByRole('button', { name: 'Overview' }));

    expect(screen.queryByText('Details')).not.toBeInTheDocument();
  });

  it('draws the light summary on a surface with a shadow', () => {
    render(
      <AkAccordion summaryText="Overview" variant="light">
        Details
      </AkAccordion>
    );

    expect(screen.getByRole('button', { name: 'Overview' })).toHaveClass('shadow-12');
  });
});

describe('AkAccordion heading', () => {
  it('holds its summary in a level-3 heading by default', () => {
    render(<AkAccordion summaryText="Overview">Details</AkAccordion>);

    expect(screen.getByRole('heading', { level: 3, name: 'Overview' })).toContainElement(
      screen.getByRole('button', { name: 'Overview' })
    );
  });

  it('holds its summary in a heading of the level it is given', () => {
    render(
      <AkAccordion summaryText="Overview" headingLevel={2}>
        Details
      </AkAccordion>
    );

    expect(screen.getByRole('heading', { level: 2, name: 'Overview' })).toBeInTheDocument();
  });
});

import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { AkChart } from '@irene/ui/ak-chart';

describe('AkChart', () => {
  it('names what it draws, since a canvas reads as nothing', () => {
    render(<AkChart option={{}} ariaLabel="Scan activity" />);

    expect(screen.getByRole('figure', { name: 'Scan activity' })).toBeInTheDocument();
  });

  it('takes the size it is given', () => {
    render(<AkChart option={{}} ariaLabel="Scan activity" className="h-64" />);

    expect(screen.getByRole('figure', { name: 'Scan activity' })).toHaveClass('h-64');
  });

  it('draws nothing where the box has no size, rather than failing', () => {
    render(
      <AkChart option={{ series: [{ type: 'bar', data: [1, 2] }] }} ariaLabel="Scan activity" />
    );

    expect(screen.getByRole('figure', { name: 'Scan activity' })).toBeEmptyDOMElement();
  });
});

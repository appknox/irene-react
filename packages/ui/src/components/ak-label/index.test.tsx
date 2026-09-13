import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';

describe('rendering', () => {
  it('renders its text', () => {
    render(<AkLabel>Project name</AkLabel>);

    expect(screen.getByText('Project name')).toBeInTheDocument();
  });

  it('marks itself for styling hooks', () => {
    render(<AkLabel>Project name</AkLabel>);

    expect(screen.getByText('Project name')).toHaveAttribute('data-slot', 'label');
  });
});

describe('pairing with a control', () => {
  it('names the input it points at', () => {
    render(
      <>
        <AkLabel htmlFor="project">Project name</AkLabel>
        <AkInput id="project" />
      </>
    );

    expect(screen.getByRole('textbox', { name: 'Project name' })).toBeInTheDocument();
  });

  it('focuses that input when clicked', async () => {
    render(
      <>
        <AkLabel htmlFor="project">Project name</AkLabel>
        <AkInput id="project" />
      </>
    );

    await userEvent.click(screen.getByText('Project name'));

    expect(screen.getByRole('textbox')).toHaveFocus();
  });
});

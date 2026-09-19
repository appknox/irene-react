import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Fragment } from 'react';
import { describe, expect, it } from 'vitest';

import { AkInput } from '@irene/ui/ak-input';
import { AkLabel } from '@irene/ui/ak-label';

describe('rendering', () => {
  it('renders its text', () => {
    render(<AkLabel>ApiProject name</AkLabel>);

    expect(screen.getByText('ApiProject name')).toBeInTheDocument();
  });

  it('marks itself for styling hooks', () => {
    render(<AkLabel>ApiProject name</AkLabel>);

    expect(screen.getByText('ApiProject name')).toHaveAttribute('data-slot', 'label');
  });
});

describe('pairing with a control', () => {
  it('names the input it points at', () => {
    render(
      <Fragment>
        <AkLabel htmlFor="project">ApiProject name</AkLabel>
        <AkInput id="project" />
      </Fragment>
    );

    expect(screen.getByRole('textbox', { name: 'ApiProject name' })).toBeInTheDocument();
  });

  it('focuses that input when clicked', async () => {
    render(
      <Fragment>
        <AkLabel htmlFor="project">ApiProject name</AkLabel>
        <AkInput id="project" />
      </Fragment>
    );

    await userEvent.click(screen.getByText('ApiProject name'));

    expect(screen.getByRole('textbox')).toHaveFocus();
  });
});

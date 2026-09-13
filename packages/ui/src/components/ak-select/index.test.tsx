import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  AkSelect,
  AkSelectContent,
  AkSelectItem,
  AkSelectTrigger,
  AkSelectValue,
} from '@irene/ui/ak-select';

const Severity = (props: React.ComponentProps<typeof AkSelect>) => (
  <AkSelect {...props}>
    <AkSelectTrigger aria-label="Severity">
      <AkSelectValue placeholder="Any severity" />
    </AkSelectTrigger>

    <AkSelectContent>
      <AkSelectItem value="critical">Critical</AkSelectItem>

      <AkSelectItem value="high">High</AkSelectItem>

      <AkSelectItem value="low" disabled>
        Low
      </AkSelectItem>
    </AkSelectContent>
  </AkSelect>
);

describe('closed state', () => {
  it('shows the placeholder until something is chosen', () => {
    render(<Severity />);

    expect(screen.getByRole('combobox', { name: 'Severity' })).toHaveTextContent('Any severity');
  });

  it('shows the label of the current value', () => {
    render(<Severity value="high" />);

    expect(screen.getByRole('combobox')).toHaveTextContent('High');
  });

  it('does not render its options', () => {
    render(<Severity />);

    expect(screen.queryByRole('option', { name: 'Critical' })).not.toBeInTheDocument();
  });
});

describe('choosing a value', () => {
  it('opens on click and lists the options', async () => {
    render(<Severity />);

    await userEvent.click(screen.getByRole('combobox'));

    expect(await screen.findByRole('option', { name: 'Critical' })).toBeInTheDocument();
    expect(screen.getByRole('option', { name: 'High' })).toBeInTheDocument();
  });

  it('reports the chosen value', async () => {
    const onValueChange = vi.fn();
    render(<Severity onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'High' }));

    expect(onValueChange).toHaveBeenCalledWith('high');
  });

  it('ignores a disabled option', async () => {
    const onValueChange = vi.fn();
    render(<Severity onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'Low' }));

    expect(onValueChange).not.toHaveBeenCalled();
  });
});

describe('keyboard use', () => {
  it('opens with the keyboard', async () => {
    render(<Severity />);

    await userEvent.tab();
    await userEvent.keyboard('{Enter}');

    expect(await screen.findByRole('option', { name: 'Critical' })).toBeInTheDocument();
  });
});

describe('disabled', () => {
  it('does not open', async () => {
    render(<Severity disabled />);

    await userEvent.click(screen.getByRole('combobox'));

    expect(screen.queryByRole('option')).not.toBeInTheDocument();
  });
});

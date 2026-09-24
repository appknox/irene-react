import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import {
  AkSelect,
  AkSelectContent,
  AkSelectGroup,
  AkSelectItem,
  AkSelectLabel,
  AkSelectSeparator,
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
  it('renders the placeholder while no value is selected', () => {
    render(<Severity />);

    expect(screen.getByRole('combobox', { name: 'Severity' })).toHaveTextContent('Any severity');
  });

  it('renders the label of the selected value', () => {
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

  it('calls onValueChange with the option the user picks', async () => {
    const onValueChange = vi.fn();
    render(<Severity onValueChange={onValueChange} />);

    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(await screen.findByRole('option', { name: 'High' }));

    expect(onValueChange).toHaveBeenCalledWith('high');
  });

  it('does not select a disabled option', async () => {
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

describe('grouped options', () => {
  const Grouped = () => (
    <AkSelect>
      <AkSelectTrigger aria-label="Scan">
        <AkSelectValue placeholder="Any scan" />
      </AkSelectTrigger>

      <AkSelectContent>
        <AkSelectGroup>
          <AkSelectLabel>Static</AkSelectLabel>

          <AkSelectItem value="static">Static scan</AkSelectItem>
        </AkSelectGroup>

        <AkSelectSeparator />

        <AkSelectGroup>
          <AkSelectLabel>Dynamic</AkSelectLabel>

          <AkSelectItem value="dynamic">Dynamic scan</AkSelectItem>
        </AkSelectGroup>
      </AkSelectContent>
    </AkSelect>
  );

  it('renders a label for each option group', async () => {
    render(<Grouped />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Scan' }));

    expect(await screen.findByRole('group', { name: 'Static' })).toBeInTheDocument();
    expect(screen.getByRole('group', { name: 'Dynamic' })).toBeInTheDocument();
  });

  it('renders a separator between groups with pointer events disabled', async () => {
    render(<Grouped />);

    await userEvent.click(screen.getByRole('combobox', { name: 'Scan' }));

    await screen.findByRole('group', { name: 'Static' });

    expect(document.querySelector('[data-slot="select-separator"]')).toHaveClass(
      'pointer-events-none'
    );
  });
});

describe('the item-aligned list position', () => {
  it('renders no popper sizing classes when the list is item-aligned', async () => {
    render(
      <AkSelect>
        <AkSelectTrigger aria-label="Severity">
          <AkSelectValue placeholder="Any severity" />
        </AkSelectTrigger>

        <AkSelectContent position="popper">
          <AkSelectItem value="critical">Critical</AkSelectItem>
        </AkSelectContent>
      </AkSelect>
    );

    await userEvent.click(screen.getByRole('combobox', { name: 'Severity' }));

    const content = await screen.findByRole('listbox');

    expect(content).toHaveClass('w-(--radix-select-trigger-width)');
  });
});

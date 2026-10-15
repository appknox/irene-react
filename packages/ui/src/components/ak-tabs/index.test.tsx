import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { type ComponentProps } from 'react';

import { AkTabs, AkTabsBadge, AkTabsContent, AkTabsList, AkTabsTrigger } from '@irene/ui/ak-tabs';

type RenderTabsOptions = ComponentProps<typeof AkTabs> & {
  variant?: ComponentProps<typeof AkTabsList>['variant'];
};

const renderTabs = ({ variant, ...props }: RenderTabsOptions = {}) =>
  render(
    <AkTabs defaultValue="files" {...props}>
      <AkTabsList variant={variant}>
        <AkTabsTrigger value="files">
          Files
          <AkTabsBadge>9</AkTabsBadge>
        </AkTabsTrigger>

        <AkTabsTrigger value="members">Members</AkTabsTrigger>

        <AkTabsTrigger value="archived" disabled>
          Archived
        </AkTabsTrigger>
      </AkTabsList>

      <AkTabsContent value="files">Files view</AkTabsContent>

      <AkTabsContent value="members">Members view</AkTabsContent>
    </AkTabs>
  );

const tab = (name: string) => screen.getByRole('tab', { name: new RegExp(name) });

describe('AkTabs', () => {
  it('reads as a tablist with one tab per trigger', () => {
    renderTabs();

    expect(screen.getByRole('tablist')).toBeInTheDocument();
    expect(screen.getAllByRole('tab')).toHaveLength(3);
  });

  it('shows the view for the tab active on mount, and only that one', () => {
    renderTabs();

    expect(tab('Files')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Files view');
    expect(screen.queryByText('Members view')).not.toBeInTheDocument();
  });

  it('switches the view when another tab is pressed', async () => {
    renderTabs();

    await userEvent.click(tab('Members'));

    expect(tab('Members')).toHaveAttribute('aria-selected', 'true');
    expect(screen.getByRole('tabpanel')).toHaveTextContent('Members view');
  });

  it('reports the chosen tab to the caller, as irene’s onTabClick did', async () => {
    const onValueChange = vi.fn();

    renderTabs({ onValueChange });

    await userEvent.click(tab('Members'));

    expect(onValueChange).toHaveBeenCalledWith('members');
  });

  it('follows the value it is given rather than its own selection', async () => {
    renderTabs({ value: 'files', defaultValue: undefined });

    await userEvent.click(tab('Members'));

    expect(tab('Files')).toHaveAttribute('aria-selected', 'true');
  });

  it('moves between tabs with the arrow keys', async () => {
    renderTabs();

    await userEvent.click(tab('Files'));
    await userEvent.keyboard('{ArrowRight}');

    expect(tab('Members')).toHaveFocus();
  });

  it('keeps a disabled tab out of reach', async () => {
    const onValueChange = vi.fn();

    renderTabs({ onValueChange });

    await userEvent.click(tab('Archived'));

    expect(tab('Archived')).toBeDisabled();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('renders a link as the tab when given one, for tabs that navigate', () => {
    render(
      <AkTabs value="files">
        <AkTabsList>
          <AkTabsTrigger value="files" asChild>
            <a href="/files">Files</a>
          </AkTabsTrigger>
        </AkTabsList>
      </AkTabs>
    );

    expect(tab('Files').tagName).toBe('A');
    expect(tab('Files')).toHaveAttribute('href', '/files');
  });
});

describe('the variant a row is drawn in', () => {
  it('marks the active tab with a bar under it unless another variant is asked for', () => {
    renderTabs();

    expect(screen.getByRole('tablist')).toHaveAttribute('data-variant', 'line');
    expect(tab('Files')).toHaveClass('after:bg-primary');
  });

  it('runs the row over a rule for the line and shadow variants', () => {
    renderTabs({ variant: 'shadow' });

    expect(screen.getByRole('tablist')).toHaveClass(
      'data-[orientation=horizontal]:border-b',
      'w-full'
    );
  });

  it('lays a vertical row out as a column, with the rule down its side', () => {
    renderTabs({ orientation: 'vertical' });

    expect(screen.getByRole('tablist')).toHaveAttribute('aria-orientation', 'vertical');
    expect(screen.getByRole('tablist')).toHaveClass('data-[orientation=vertical]:border-r');
  });

  it('lifts the active tab as a card for the shadow variant', () => {
    renderTabs({ variant: 'shadow' });

    expect(tab('Files')).toHaveClass('data-[state=active]:shadow-4');
    expect(tab('Files')).not.toHaveClass('after:bg-primary');
  });

  it('draws the row as a tinted track for the segmented variant', () => {
    renderTabs({ variant: 'segmented' });

    expect(screen.getByRole('tablist')).toHaveClass('bg-divider-strong', 'w-fit');
    expect(tab('Files')).toHaveClass('data-[state=active]:bg-background');
  });
});

describe('the count beside a tab', () => {
  it('sits inside the tab it counts for', () => {
    renderTabs();

    expect(within(tab('Files')).getByText('9')).toBeInTheDocument();
  });

  it('sits on a tint that follows the tab, unless asked to be bare text', () => {
    render(
      <AkTabs defaultValue="files">
        <AkTabsList>
          <AkTabsTrigger value="files">
            Files
            <AkTabsBadge>9</AkTabsBadge>
          </AkTabsTrigger>

          <AkTabsTrigger value="members">
            Members
            <AkTabsBadge background={false}>4</AkTabsBadge>
          </AkTabsTrigger>
        </AkTabsList>
      </AkTabs>
    );

    expect(screen.getByText('9')).toHaveClass('bg-divider-strong');
    expect(screen.getByText('4')).toHaveClass('bg-transparent');
  });
});

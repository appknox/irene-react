import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import type { ComponentProps } from 'react';

import {
  AkDrawer,
  AkDrawerBody,
  AkDrawerContent,
  AkDrawerFooter,
  AkDrawerHeader,
  AkDrawerTrigger,
} from '@irene/ui/ak-drawer';

const AboutReport = ({
  anchor,
  ...props
}: ComponentProps<typeof AkDrawer> & { anchor?: 'left' | 'right' }) => (
  <AkDrawer {...props}>
    <AkDrawerTrigger>What is this?</AkDrawerTrigger>

    <AkDrawerContent anchor={anchor}>
      <AkDrawerHeader title="About this report" closeLabel="Close" />

      <AkDrawerBody>
        <p>The report lists what the scan found.</p>
      </AkDrawerBody>

      <AkDrawerFooter>
        <button type="button">Download</button>
      </AkDrawerFooter>
    </AkDrawerContent>
  </AkDrawer>
);

const openDrawer = async () => {
  render(<AboutReport />);

  await userEvent.click(screen.getByText('What is this?'));

  return screen.findByRole('dialog', { name: 'About this report' });
};

describe('AkDrawer', () => {
  it('renders nothing until the trigger is used', () => {
    render(<AboutReport />);

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens from its trigger', async () => {
    expect(await openDrawer()).toBeInTheDocument();
  });

  it('names itself for a screen reader, from the header title', async () => {
    const drawer = await openDrawer();

    expect(drawer).toHaveAccessibleName('About this report');
  });

  it('renders the body and the footer inside it', async () => {
    await openDrawer();

    expect(screen.getByText('The report lists what the scan found.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download' })).toBeInTheDocument();
  });

  it('closes from the control in its header', async () => {
    await openDrawer();

    await userEvent.click(screen.getByRole('button', { name: 'Close' }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('closes on Escape, the page behind it being reachable again', async () => {
    await openDrawer();

    await userEvent.keyboard('{Escape}');

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('slides in from the right unless another edge is named', async () => {
    const drawer = await openDrawer();

    expect(drawer).toHaveAttribute('data-anchor', 'right');
    expect(drawer).toHaveClass('right-0');
  });

  it('slides in from the edge it is anchored to', async () => {
    render(<AboutReport anchor="left" />);

    await userEvent.click(screen.getByText('What is this?'));

    const drawer = await screen.findByRole('dialog', { name: 'About this report' });

    expect(drawer).toHaveAttribute('data-anchor', 'left');
    expect(drawer).toHaveClass('left-0');
  });

  it('draws its header at the height of a page bar, so the two line up', async () => {
    await openDrawer();

    expect(document.querySelector('[data-slot="drawer-header"]')).toHaveClass('h-14');
  });

  it('stays open while the caller holds it open', async () => {
    render(<AboutReport open />);

    expect(await screen.findByRole('dialog', { name: 'About this report' })).toBeInTheDocument();
  });
});

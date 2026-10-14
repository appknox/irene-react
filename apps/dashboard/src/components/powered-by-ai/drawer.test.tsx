import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { PoweredByAiDrawer, type PoweredByAiSection } from '@/components/powered-by-ai';
import { renderWithProviders } from '@tests/render';

const SECTIONS: PoweredByAiSection[] = [
  { title: 'What data does the AI access?', body: 'A limited, sanitized summary.' },
  { title: 'How is your data protected?', points: ['It is not sent', 'It is not stored'] },
];

const openDrawer = async () => {
  renderWithProviders(<PoweredByAiDrawer sections={SECTIONS} />);

  await userEvent.click(screen.getByRole('button', { name: akMT('aiPoweredFeatures') }));

  return screen.findByRole('dialog', { name: akMT('aiPoweredFeatures') });
};

describe('PoweredByAiDrawer', () => {
  it('renders the chip on the control that opens it', () => {
    renderWithProviders(<PoweredByAiDrawer sections={SECTIONS} />);

    expect(document.querySelector('[data-test-powered-by-ai-chip]')).toBeInTheDocument();
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('opens from the chip', async () => {
    expect(await openDrawer()).toBeInTheDocument();
  });

  it('repeats the chip inside, which is what the panel explains', async () => {
    const drawer = await openDrawer();

    expect(within(drawer).getByText(/powered by/i)).toBeInTheDocument();
  });

  it('renders a section written as a paragraph', async () => {
    const drawer = await openDrawer();

    expect(within(drawer).getByText(SECTIONS[0].title)).toBeInTheDocument();
    expect(within(drawer).getByText('A limited, sanitized summary.')).toBeInTheDocument();
  });

  it('renders a section written as a list', async () => {
    const drawer = await openDrawer();

    expect(within(drawer).getByText(SECTIONS[1].title)).toBeInTheDocument();

    expect(
      within(drawer)
        .getAllByRole('listitem')
        .map((item) => item.textContent)
    ).toEqual(SECTIONS[1].points);
  });

  it('closes from the control in its header', async () => {
    await openDrawer();

    await userEvent.click(screen.getByRole('button', { name: akMT('close') }));

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });
});

import { faker } from '@faker-js/faker';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { akMT } from '@irene/translations/intl';

import { ListingSearch } from './listing-search';

describe('the listing search', () => {
  it('reports text with spaces around it once, trimmed, and not again when the URL echoes it', async () => {
    const term = faker.string.alpha({ length: 8 });
    const onSearch = vi.fn();

    const { rerender } = render(<ListingSearch query="" onSearch={onSearch} />);

    await userEvent.type(screen.getByRole('textbox', { name: akMT('searchQuery') }), ` ${term} `);

    await waitFor(() => expect(onSearch).toHaveBeenCalledWith(term), { timeout: 3000 });

    rerender(<ListingSearch query={term} onSearch={onSearch} />);

    await new Promise((resolve) => setTimeout(resolve, 900));

    expect(onSearch).toHaveBeenCalledTimes(1);
  });
});

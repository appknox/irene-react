import { useState } from 'react';
import { fn } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkPagination, type AkPaginationPage } from '@irene/ui/ak-pagination';

const meta = {
  title: 'Components/AkPagination',
  component: AkPagination,
  tags: ['autodocs'],
  argTypes: {
    variant: { control: 'inline-radio', options: ['default', 'compact'] },
  },
  args: {
    totalItems: 42,
    limit: 10,
    offset: 0,
    itemPerPageOptions: [10, 25, 50],
    tableItemLabel: 'apps',
    perPageLabel: 'Records per page',
    variant: 'default',
    onPageChange: fn(),
    onItemPerPageChange: fn(),
  },
} satisfies Meta<typeof AkPagination>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const Controlled: Story = {
  render: function ControlledPagination(args) {
    const [page, setPage] = useState<AkPaginationPage>({ limit: 10, offset: 0 });

    return (
      <AkPagination {...args} {...page} onPageChange={setPage} onItemPerPageChange={setPage} />
    );
  },
};

export const Compact: Story = {
  args: { variant: 'compact' },
};

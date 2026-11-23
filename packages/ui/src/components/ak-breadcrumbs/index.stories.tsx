import type { Meta, StoryObj } from '@storybook/react-vite';
import { AkBreadcrumbs, AkBreadcrumbsItem } from '@irene/ui/ak-breadcrumbs';

const meta = {
  title: 'Components/AkBreadcrumbs',
  component: AkBreadcrumbs,
  tags: ['autodocs'],
  args: {
    'aria-label': 'Breadcrumb',
    children: [
      <AkBreadcrumbsItem key="inventory" asChild>
        <a href="#inventory">App inventory</a>
      </AkBreadcrumbsItem>,

      <AkBreadcrumbsItem key="details" asChild>
        <a href="#details">Inventory details (com.example.app)</a>
      </AkBreadcrumbsItem>,

      <AkBreadcrumbsItem key="version" current>
        Unscanned version
      </AkBreadcrumbsItem>,
    ],
  },
} satisfies Meta<typeof AkBreadcrumbs>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {};

export const CustomSeparator: Story = {
  args: { separator: '›' },
};

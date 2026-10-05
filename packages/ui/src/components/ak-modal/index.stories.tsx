import type { Meta, StoryObj } from '@storybook/react-vite';

import {
  AkModal,
  AkModalBody,
  AkModalClose,
  AkModalContent,
  AkModalFooter,
  AkModalHeader,
  AkModalTrigger,
} from '@irene/ui/ak-modal';

import { AkButton } from '@irene/ui/ak-button';
import { AkChip } from '@irene/ui/ak-chip';
import { AkInput } from '@irene/ui/ak-input';
import { AkTypography } from '@irene/ui/ak-typography';

const meta = {
  title: 'Components/AkModal',
  component: AkModalContent,
  tags: ['autodocs'],
  args: {},
} satisfies Meta<typeof AkModalContent>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Playground: Story = {
  render: (args) => (
    <AkModal>
      <AkModalTrigger asChild>
        <AkButton variant="outlined">Invite a teammate</AkButton>
      </AkModalTrigger>

      <AkModalContent {...args}>
        <AkModalHeader title="Invite a teammate" closeLabel="Close" />

        <AkModalBody className="w-100">
          <AkTypography variant="body1">
            They are sent a link that signs them into this organization.
          </AkTypography>
        </AkModalBody>
      </AkModalContent>
    </AkModal>
  ),
};

/** A header carries whatever else names the panel, such as a chip for a feature still in beta. */
export const HeaderWithAChip: Story = {
  render: (args) => (
    <AkModal>
      <AkModalTrigger asChild>
        <AkButton variant="outlined">Upload using a link</AkButton>
      </AkModalTrigger>

      <AkModalContent {...args}>
        <AkModalHeader title="Upload using a link" closeLabel="Close">
          <AkChip color="primary" size="small" label="Beta" />
        </AkModalHeader>

        <AkModalBody className="w-112.5">
          <AkTypography variant="body1">
            The app is fetched from the store, so only the link is sent.
          </AkTypography>
        </AkModalBody>
      </AkModalContent>
    </AkModal>
  ),
};

/** A footer holds what the panel is for, and is shadowed off the body above it. */
export const WithAFooter: Story = {
  render: (args) => (
    <AkModal>
      <AkModalTrigger asChild>
        <AkButton variant="outlined">Invite a teammate</AkButton>
      </AkModalTrigger>

      <AkModalContent {...args}>
        <AkModalHeader title="Invite a teammate" closeLabel="Close" />

        <AkModalBody className="flex w-100 flex-col gap-2">
          <AkTypography variant="subtitle1">Email</AkTypography>

          <AkInput placeholder="teammate@appknox.com" />
        </AkModalBody>

        <AkModalFooter className="px-5.25 py-3.5">
          <AkButton className="w-full">Send invitation</AkButton>
        </AkModalFooter>
      </AkModalContent>
    </AkModal>
  ),
};

/** A body long enough to scroll keeps the header and footer in place. */
export const ScrollingBody: Story = {
  render: (args) => (
    <AkModal>
      <AkModalTrigger asChild>
        <AkButton variant="outlined">Read the terms</AkButton>
      </AkModalTrigger>

      <AkModalContent {...args}>
        <AkModalHeader title="Terms of service" closeLabel="Close" />

        <AkModalBody className="flex w-100 flex-col gap-3.5">
          {Array.from({ length: 60 }, (_unused, index) => (
            <AkTypography key={index} variant="body1">
              Clause {index + 1}. What the parties agree to, at length.
            </AkTypography>
          ))}
        </AkModalBody>

        <AkModalFooter className="px-5.25 py-3.5">
          <AkModalClose asChild>
            <AkButton className="w-full">I agree</AkButton>
          </AkModalClose>
        </AkModalFooter>
      </AkModalContent>
    </AkModal>
  ),
};

/** A body that lays out its own padding takes none from the panel. */
export const WithoutAGutter: Story = {
  render: (args) => (
    <AkModal>
      <AkModalTrigger asChild>
        <AkButton variant="outlined">Open</AkButton>
      </AkModalTrigger>

      <AkModalContent {...args}>
        <AkModalHeader title="Nothing between the edges" closeLabel="Close" />

        <AkModalBody noGutter className="w-100">
          <div className="bg-background-subtle py-3.5 text-center">
            <AkTypography variant="body1">Edge to edge</AkTypography>
          </div>

          <div className="bg-primary-surface py-3.5 text-center">
            <AkTypography variant="body1">No padding from the panel</AkTypography>
          </div>
        </AkModalBody>
      </AkModalContent>
    </AkModal>
  ),
};

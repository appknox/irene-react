import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import type { Meta, StoryObj } from '@storybook/react-vite';

import { AkButton } from '@irene/ui/ak-button';
import { AkFormField, AkFormProvider } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';

const schema = z.object({
  email: z.email('Enter a valid email address'),
});

type Values = z.infer<typeof schema>;

/** What the schema says about an empty field, so the story cannot drift from it. */
const emptyFieldMessage = schema.safeParse({ email: '' }).error?.issues[0]?.message ?? '';

/**
 * One field wired end to end. `invalid` sets the error directly so the rejected
 * state is visible in the gallery without anyone having to interact with it.
 */

type EmailFieldProps = {
  description?: string;
  invalid?: boolean;
};

function EmailField({ description, invalid = false }: Readonly<EmailFieldProps>) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const { setError } = form;

  useEffect(() => {
    if (invalid) {
      setError('email', { type: 'manual', message: emptyFieldMessage });
    }
  }, [invalid, setError]);

  return (
    <AkFormProvider {...form}>
      <form className="w-72 space-y-4" onSubmit={form.handleSubmit(() => {})}>
        <AkFormField name="email" label="Email" description={description}>
          <AkInput placeholder="you@appknox.com" />
        </AkFormField>

        <AkButton type="submit">Sign in</AkButton>
      </form>
    </AkFormProvider>
  );
}

const meta = {
  title: 'Components/AkFormProvider',
  component: EmailField,
  parameters: { layout: 'centered' },
  tags: ['autodocs'],
  argTypes: { invalid: { control: 'boolean' } },
} satisfies Meta<typeof EmailField>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Every state side by side, to catch one drifting from the others. */
export const AllStates: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      <EmailField />
      <EmailField description="We only use this to sign you in." />
      <EmailField invalid />
    </div>
  ),
};

export const Default: Story = {};

export const WithDescription: Story = {
  args: { description: 'We only use this to sign you in.' },
};

export const WithError: Story = {
  args: { invalid: true },
};

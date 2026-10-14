import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it } from 'vitest';
import * as z from 'zod';

import { AkFormProvider } from '@irene/ui/ak-form';
import { createAkFormField } from '@irene/ui/ak-form/helpers';
import { AkInput } from '@irene/ui/ak-input';

const schema = z.object({ email: z.email('Enter a valid email') });

type Values = z.infer<typeof schema>;

/* Built once at module scope, as a form that is rebuilt per render loses what was typed. */
const EmailField = createAkFormField<Values>();

function BoundForm() {
  const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

  return (
    <AkFormProvider {...form}>
      <form onSubmit={form.handleSubmit(() => {})}>
        <EmailField name="email" label="Email" description="We only use this to sign you in.">
          <AkInput />
        </EmailField>

        <button type="submit">Sign in</button>
      </form>
    </AkFormProvider>
  );
}

describe('createAkFormField', () => {
  it('renders the field it was given, with its label and description', () => {
    render(<BoundForm />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByText('We only use this to sign you in.')).toBeInTheDocument();
  });

  it('binds the control to the form value the name points at', async () => {
    render(<BoundForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'someone@example.test');

    expect(screen.getByLabelText('Email')).toHaveValue('someone@example.test');
  });

  it('carries the schema message through, so the binding validates', async () => {
    render(<BoundForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email')).toBeInTheDocument();
  });

  it('builds a component of its own per form, rather than sharing one', () => {
    expect(createAkFormField<Values>()).not.toBe(createAkFormField<Values>());
  });
});

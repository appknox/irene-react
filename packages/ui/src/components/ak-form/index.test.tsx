import { faker } from '@faker-js/faker';
import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import type { ReactNode } from 'react';

import { AkFormField, AkFormProvider } from '@irene/ui/ak-form';
import { useAkFormField } from '@irene/ui/ak-form/context';
import { AkInput } from '@irene/ui/ak-input';

const EMAIL = faker.internet.email();

const schema = z.object({
  email: z.email('Enter a valid email address'),
});

type Values = z.infer<typeof schema>;

function TestForm({
  onValid = vi.fn(),
  children = <AkInput />,
  labelAction,
}: {
  onValid?: (values: Values) => void;
  children?: ReactNode;
  labelAction?: ReactNode;
}) {
  const form = useForm<Values>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  return (
    <AkFormProvider {...form}>
      <form onSubmit={form.handleSubmit(onValid)}>
        <AkFormField
          name="email"
          label="Email"
          labelAction={labelAction}
          description="We only use this to sign you in."
        >
          {children}
        </AkFormField>

        <button type="submit">Sign in</button>
      </form>
    </AkFormProvider>
  );
}

describe('the control as a child', () => {
  it("calls the control's own onChange as well as the field's", async () => {
    const onChange = vi.fn();
    const onValid = vi.fn();

    render(
      <TestForm onValid={onValid}>
        <AkInput onChange={onChange} />
      </TestForm>
    );

    await userEvent.type(screen.getByLabelText('Email'), 'a@b.com');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(onChange).toHaveBeenCalled();

    expect(onValid).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'a@b.com' }),
      expect.anything()
    );
  });

  it('renders an action opposite the label', () => {
    render(<TestForm labelAction={<a href="/recover">Forgot Password?</a>} />);

    expect(screen.getByRole('link', { name: 'Forgot Password?' })).toBeInTheDocument();
  });
});

describe('rendering', () => {
  it('points the label at the control with htmlFor', () => {
    render(<TestForm />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('points aria-describedby at the description', () => {
    render(<TestForm />);

    const describedBy = screen.getByLabelText('Email').getAttribute('aria-describedby');

    expect(describedBy).toBe(screen.getByText('We only use this to sign you in.').id);
  });

  it('renders no error before the form is submitted', () => {
    render(<TestForm />);

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'false');
  });
});

describe('validation', () => {
  it('renders the schema message when the value fails validation', async () => {
    render(<TestForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('sets aria-invalid and aria-describedby on the control', async () => {
    render(<TestForm />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByText('Enter a valid email address');

    const control = screen.getByLabelText('Email');
    const messageId = screen.getByText('Enter a valid email address').id;

    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control.getAttribute('aria-describedby')).toContain(messageId);
  });

  it('does not call onSubmit while the value fails validation', async () => {
    const onValid = vi.fn();
    render(<TestForm onValid={onValid} />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByText('Enter a valid email address');

    expect(onValid).not.toHaveBeenCalled();
  });

  it('calls onSubmit with the values once they pass', async () => {
    const onValid = vi.fn();
    render(<TestForm onValid={onValid} />);

    await userEvent.type(screen.getByLabelText('Email'), EMAIL);
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(onValid).toHaveBeenCalledWith({ email: EMAIL }, expect.anything());
  });

  it('clears the message once the value is corrected', async () => {
    render(<TestForm />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByText('Enter a valid email address');

    await userEvent.type(screen.getByLabelText('Email'), EMAIL);

    expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
  });
});

describe('a field with no label', () => {
  function UnlabelledForm() {
    const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

    return (
      <AkFormProvider {...form}>
        <AkFormField name="email">
          <AkInput aria-label="Email" />
        </AkFormField>
      </AkFormProvider>
    );
  }

  it('renders the control without the label row', () => {
    render(<UnlabelledForm />);

    expect(screen.getByRole('textbox', { name: 'Email' })).toBeInTheDocument();
    expect(screen.queryByText('Email', { selector: 'label' })).not.toBeInTheDocument();
  });
});

describe('the error message under a field', () => {
  function ErrorForm() {
    const form = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { email: '' } });

    return (
      <AkFormProvider {...form}>
        <AkFormField name="email" label="Email">
          <AkInput />
        </AkFormField>

        <button type="button" onClick={() => form.setError('email', { type: 'server' })}>
          Refuse
        </button>
      </AkFormProvider>
    );
  }

  it('marks the field invalid when the error carries no message', async () => {
    render(<ErrorForm />);

    await userEvent.click(screen.getByRole('button', { name: 'Refuse' }));

    const message = document.querySelector('[data-slot="form-message"]');

    expect(message).toHaveTextContent('');
    expect(message?.querySelector('svg')).toBeInTheDocument();
  });
});

describe('useAkFormField outside a field', () => {
  function Orphan() {
    useAkFormField();

    return null;
  }

  it('throws when called outside an AkFormField', () => {
    expect(() => render(<Orphan />)).toThrow('useAkFormField should be used within <AkFormField>');
  });
});

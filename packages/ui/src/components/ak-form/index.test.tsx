import { zodResolver } from '@hookform/resolvers/zod';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useForm } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import * as z from 'zod';
import type { ReactNode } from 'react';

import { AkForm, AkFormField } from '@irene/ui/ak-form';
import { AkInput } from '@irene/ui/ak-input';

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
    <AkForm {...form}>
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
    </AkForm>
  );
}

describe('the control as a child', () => {
  it("keeps the control's own change handler alongside the field's", async () => {
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
  it('ties the label to the control', () => {
    render(<TestForm />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('describes the control with its description', () => {
    render(<TestForm />);

    const describedBy = screen.getByLabelText('Email').getAttribute('aria-describedby');

    expect(describedBy).toBe(screen.getByText('We only use this to sign you in.').id);
  });

  it('reports no error before submission', () => {
    render(<TestForm />);

    expect(screen.getByLabelText('Email')).toHaveAttribute('aria-invalid', 'false');
  });
});

describe('validation', () => {
  it('shows the schema message when the value is rejected', async () => {
    render(<TestForm />);

    await userEvent.type(screen.getByLabelText('Email'), 'not-an-email');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Enter a valid email address')).toBeInTheDocument();
  });

  it('marks the control invalid and points at the message', async () => {
    render(<TestForm />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByText('Enter a valid email address');

    const control = screen.getByLabelText('Email');
    const messageId = screen.getByText('Enter a valid email address').id;

    expect(control).toHaveAttribute('aria-invalid', 'true');
    expect(control.getAttribute('aria-describedby')).toContain(messageId);
  });

  it('does not submit while the value is rejected', async () => {
    const onValid = vi.fn();
    render(<TestForm onValid={onValid} />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByText('Enter a valid email address');

    expect(onValid).not.toHaveBeenCalled();
  });

  it('submits the values once they pass', async () => {
    const onValid = vi.fn();
    render(<TestForm onValid={onValid} />);

    await userEvent.type(screen.getByLabelText('Email'), 'someone@appknox.com');
    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(onValid).toHaveBeenCalledWith({ email: 'someone@appknox.com' }, expect.anything());
  });

  it('clears the message once the value is corrected', async () => {
    render(<TestForm />);

    await userEvent.click(screen.getByRole('button', { name: 'Sign in' }));
    await screen.findByText('Enter a valid email address');

    await userEvent.type(screen.getByLabelText('Email'), 'someone@appknox.com');

    expect(screen.queryByText('Enter a valid email address')).not.toBeInTheDocument();
  });
});

import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';

import { AkCodeBlock } from '@irene/ui/ak-code-block';

const block = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="code-block"]');

describe('AkCodeBlock', () => {
  it('shows the code as it is to be pasted', () => {
    const code = `${faker.lorem.words()}\n  ${faker.lorem.words()}`;
    const { container } = render(<AkCodeBlock code={code} />);

    expect(container.querySelector('pre code')?.textContent).toBe(code);
  });

  it('is light by default and dark when asked', () => {
    const { container, rerender } = render(<AkCodeBlock code={faker.lorem.word()} />);

    expect(block(container)).toHaveAttribute('data-variant', 'light');

    rerender(<AkCodeBlock code={faker.lorem.word()} variant="dark" />);

    expect(block(container)).toHaveAttribute('data-variant', 'dark');
  });

  it('has no copy button without a label for it', () => {
    render(<AkCodeBlock code={faker.lorem.word()} onCopy={vi.fn()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('has no copy button without anyone to copy', () => {
    render(<AkCodeBlock code={faker.lorem.word()} copyLabel={faker.lorem.word()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('hands the code to the caller to copy', async () => {
    const user = userEvent.setup();
    const code = faker.lorem.sentence();
    const copyLabel = faker.lorem.word();
    const onCopy = vi.fn();

    render(<AkCodeBlock code={code} copyLabel={copyLabel} onCopy={onCopy} />);

    await user.click(screen.getByRole('button', { name: copyLabel }));

    expect(onCopy).toHaveBeenCalledExactlyOnceWith(code);
  });
});

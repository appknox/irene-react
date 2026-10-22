import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { AkCodeBlock } from '@irene/ui/ak-code-block';

const block = (container: HTMLElement) =>
  container.querySelector<HTMLElement>('[data-slot="code-block"]');

describe('AkCodeBlock', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('shows the code as it is to be pasted', () => {
    const code = `${faker.lorem.words()}\n  ${faker.lorem.words()}`;
    const { container } = render(<AkCodeBlock code={code} />);

    expect(container.querySelector('pre code')?.textContent).toBe(code);
  });

  it('draws a tinted panel by default and white on black for dark', () => {
    const { container, rerender } = render(<AkCodeBlock code={faker.lorem.word()} />);

    expect(block(container)).toHaveClass('bg-background-subtle');
    expect(block(container)).toHaveAttribute('data-variant', 'light');

    rerender(<AkCodeBlock code={faker.lorem.word()} variant="dark" />);

    expect(block(container)).toHaveClass('bg-black', 'text-white');
    expect(block(container)).toHaveAttribute('data-variant', 'dark');
  });

  it('has no copy button without a label for it', () => {
    render(<AkCodeBlock code={faker.lorem.word()} />);

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('copies the code and says so', async () => {
    const user = userEvent.setup();
    const code = faker.lorem.sentence();
    const copyLabel = faker.lorem.word();
    const onCopy = vi.fn();

    render(<AkCodeBlock code={code} copyLabel={copyLabel} onCopy={onCopy} />);

    await user.click(screen.getByRole('button', { name: copyLabel }));

    expect(await navigator.clipboard.readText()).toBe(code);
    expect(onCopy).toHaveBeenCalledOnce();
  });

  it('hands back the error when the browser refuses the copy', async () => {
    const user = userEvent.setup();
    const copyLabel = faker.lorem.word();
    const error = new Error(faker.lorem.words());
    const onCopy = vi.fn();
    const onCopyError = vi.fn();

    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(error);

    render(
      <AkCodeBlock
        code={faker.lorem.word()}
        copyLabel={copyLabel}
        onCopy={onCopy}
        onCopyError={onCopyError}
      />
    );

    await user.click(screen.getByRole('button', { name: copyLabel }));

    expect(onCopyError).toHaveBeenCalledWith(error);
    expect(onCopy).not.toHaveBeenCalled();
  });

  it('copies quietly when no one listens', async () => {
    const user = userEvent.setup();
    const code = faker.lorem.sentence();
    const copyLabel = faker.lorem.word();

    render(<AkCodeBlock code={code} copyLabel={copyLabel} />);

    await user.click(screen.getByRole('button', { name: copyLabel }));

    expect(await navigator.clipboard.readText()).toBe(code);
  });

  it('swallows a refused copy when no one listens for it', async () => {
    const user = userEvent.setup();
    const copyLabel = faker.lorem.word();

    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error(faker.lorem.words()));

    render(<AkCodeBlock code={faker.lorem.word()} copyLabel={copyLabel} />);

    await expect(
      user.click(screen.getByRole('button', { name: copyLabel }))
    ).resolves.toBeUndefined();
  });
});

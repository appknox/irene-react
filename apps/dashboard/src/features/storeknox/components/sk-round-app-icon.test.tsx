import { faker } from '@faker-js/faker';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { SkRoundAppIcon } from './sk-round-app-icon';

const placeholder = () =>
  document.querySelector<HTMLElement>('[data-test-sk-round-app-icon-placeholder]');

describe('SkRoundAppIcon', () => {
  it('shows the image with its alt text while it loads', () => {
    const src = faker.image.url();
    const alt = faker.commerce.productName();

    render(<SkRoundAppIcon src={src} alt={alt} className="size-8" />);

    expect(screen.getByRole('img', { name: alt })).toHaveAttribute('src', src);
    expect(placeholder()).not.toBeInTheDocument();
  });

  it('shows the placeholder when there is no src', () => {
    const alt = faker.commerce.productName();

    render(<SkRoundAppIcon src="" alt={alt} className="size-8" />);

    expect(screen.queryByRole('img', { name: alt })).not.toBeInTheDocument();
    expect(placeholder()).toBeInTheDocument();
  });

  it('shows the placeholder once the image fails to load', () => {
    const alt = faker.commerce.productName();

    render(<SkRoundAppIcon src={faker.image.url()} alt={alt} className="size-8" />);

    fireEvent.error(screen.getByRole('img', { name: alt }));

    expect(screen.queryByRole('img', { name: alt })).not.toBeInTheDocument();
    expect(placeholder()).toBeInTheDocument();
  });

  it('tries a new src after the previous one failed', () => {
    const alt = faker.commerce.productName();
    const next = faker.image.url();
    const { rerender } = render(<SkRoundAppIcon src={faker.image.url()} alt={alt} />);

    fireEvent.error(screen.getByRole('img', { name: alt }));
    rerender(<SkRoundAppIcon src={next} alt={alt} />);

    expect(screen.getByRole('img', { name: alt })).toHaveAttribute('src', next);
  });

  it('hides the placeholder from assistive tech when the icon is decorative', () => {
    render(<SkRoundAppIcon src="" alt="" />);

    expect(placeholder()).toHaveAttribute('aria-hidden', 'true');
  });

  it('leaves the placeholder exposed when the icon is named', () => {
    render(<SkRoundAppIcon src="" alt={faker.commerce.productName()} />);

    expect(placeholder()).not.toHaveAttribute('aria-hidden');
  });
});

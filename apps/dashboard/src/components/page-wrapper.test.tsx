import { faker } from '@faker-js/faker';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { PageWrapper } from '@/components/page-wrapper';

describe('PageWrapper', () => {
  it('frames its content as irene’s page wrapper does', () => {
    const content = faker.lorem.sentence();

    render(<PageWrapper data-testid="page">{content}</PageWrapper>);

    expect(screen.getByTestId('page')).toHaveTextContent(content);

    expect(screen.getByTestId('page')).toHaveClass('px-5.25', 'pt-3.5', 'pb-5.25');
  });

  it('leaves the width to the layout unless a page caps its own content', () => {
    render(<PageWrapper data-testid="page" />);

    expect(screen.getByTestId('page')).not.toHaveClass('max-w-310.5');
  });

  it('caps a page at irene’s 1200px content, or 1340px for a wide page, plus its padding', () => {
    render(
      <>
        <PageWrapper data-testid="standard" contentWidth="standard" />

        <PageWrapper data-testid="wide" contentWidth="wide" />
      </>
    );

    expect(screen.getByTestId('standard')).toHaveClass('mx-auto', 'max-w-310.5');
    expect(screen.getByTestId('wide')).toHaveClass('mx-auto', 'max-w-345.5');
  });

  it('lets a page drop the padding on the side where it splits the frame', () => {
    render(<PageWrapper data-testid="page" className="pt-0" />);

    expect(screen.getByTestId('page')).toHaveClass('pt-0');
    expect(screen.getByTestId('page')).not.toHaveClass('pt-3.5');
  });
});

import type { Preview } from '@storybook/react-vite';

import { StoryLayout } from '@irene/ui/story-layout';

// The design system entry: layer order, fonts, tokens and base styles. Stories
// render against exactly what an app renders against.
import '@irene/ui/styles/index.css';

const preview: Preview = {
  decorators: [
    /* The docs view prints the name and the description itself, so only the canvas needs them. */
    (Story, context) => {
      const onCanvas = context.viewMode !== 'docs';

      return (
        <StoryLayout
          title={onCanvas ? context.name : undefined}
          description={onCanvas ? context.parameters.docs?.description?.story : undefined}
        >
          <Story />
        </StoryLayout>
      );
    },
  ],

  parameters: {
    layout: 'fullscreen',
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    options: {
      storySort: { order: ['Tokens', 'UI', 'Components'] },
    },
  },
};

export default preview;

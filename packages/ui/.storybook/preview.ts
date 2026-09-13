import type { Preview } from '@storybook/react-vite';

// The design system entry: layer order, fonts, tokens and base styles. Stories
// render against exactly what an app renders against.
import '@irene/ui/styles/index.css';

const preview: Preview = {
  parameters: {
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

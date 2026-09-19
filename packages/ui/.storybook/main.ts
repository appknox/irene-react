import type { StorybookConfig } from '@storybook/react-vite';

const config: StorybookConfig = {
  stories: ['../src/**/*.stories.@(ts|tsx)'],
  core: { disableTelemetry: true },

  framework: {
    name: '@storybook/react-vite',
    options: {},
  },

  async viteFinal(config) {
    const { mergeConfig } = await import('vite');
    const tailwindcss = (await import('@tailwindcss/vite')).default;
    const { svgrPlugin } = await import('@irene/ui/vite');

    return mergeConfig(config, {
      plugins: [tailwindcss(), svgrPlugin()],
    });
  },
};

export default config;

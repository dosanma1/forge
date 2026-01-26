import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
	stories: ['../../**/*.mdx', '../../**/*.stories.@(js|jsx|mjs|ts|tsx)'],
	addons: [
		'@storybook/addon-onboarding',
		'@chromatic-com/storybook',
		'@storybook/addon-docs'
	],
	framework: {
		name: '@storybook/angular',
		options: {},
	},
};
export default config;

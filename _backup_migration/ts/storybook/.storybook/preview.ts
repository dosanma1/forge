import { provideHttpClient } from '@angular/common/http';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideRouter } from '@angular/router';
import { withThemeByClassName } from '@storybook/addon-themes';
import {
	applicationConfig,
	type Decorator,
	type Preview,
} from '@storybook/angular';

export const decorators: Decorator[] = [
	withThemeByClassName({
		themes: {
			light: 'light',
			dark: 'dark',
		},
		defaultTheme: 'light',
	}),
	applicationConfig({
		providers: [
			provideRouter([]),
			provideAnimationsAsync(),
			provideHttpClient(),
		],
	}),
];

const preview: Preview = {
	decorators,
	parameters: {
		layout: 'centered',
		backgrounds: {
			options: {
				dark: { name: 'Dark', value: '#333' },
				light: { name: 'Light', value: '#fff' },
			},
		},
		options: {
			storySort: {
				method: 'alphabetical',
			},
		},
		controls: {
			matchers: {
				color: /(background|color)$/i,
				date: /Date$/i,
			},
		},
	},
	tags: ['autodocs'],
	initialGlobals: {
		backgrounds: { value: 'light' },
	},
};

export default preview;

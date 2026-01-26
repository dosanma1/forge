/* eslint-disable no-undef */
/* eslint-disable @typescript-eslint/no-require-imports */

/** @type {import('tailwindcss').Config} */
module.exports = {
	content: [
		'./projects/storybook/src/**/*.{html,ts,js,mjs,scss,css}',
		'./projects/ui/src/**/*.{html,ts,js,mjs,scss,css}',
	],
	darkMode: ['[data-mode="dark"]'],
	theme: {
		container: {
			center: true,
			padding: '2rem',
			screens: {
				'2xl': '1400px',
			},
		},
		extend: {
			colors: {
				background: 'oklch(var(--background) / <alpha-value>)',
				foreground: 'oklch(var(--foreground) / <alpha-value>)',
				border: 'oklch(var(--border) / <alpha-value>)',
				input: 'oklch(var(--input) / <alpha-value>)',
				ring: 'oklch(var(--ring) / <alpha-value>)',
				primary: {
					DEFAULT: 'oklch(var(--primary) / <alpha-value>)',
					foreground:
						'oklch(var(--primary-foreground) / <alpha-value>)',
				},
				secondary: {
					DEFAULT: 'oklch(var(--secondary) / <alpha-value>)',
					foreground:
						'oklch(var(--secondary-foreground) / <alpha-value>)',
				},
				destructive: {
					DEFAULT: 'oklch(var(--destructive) / <alpha-value>)',
					foreground:
						'oklch(var(--destructive-foreground) / <alpha-value>)',
				},
				muted: {
					DEFAULT: 'oklch(var(--muted) / <alpha-value>)',
					foreground:
						'oklch(var(--muted-foreground) / <alpha-value>)',
				},
				accent: {
					DEFAULT: 'oklch(var(--accent) / <alpha-value>)',
					foreground:
						'oklch(var(--accent-foreground) / <alpha-value>)',
				},
				success: {
					DEFAULT: 'oklch(var(--success) / <alpha-value>)',
					foreground:
						'oklch(var(--success-foreground) / <alpha-value>)',
				},
				warning: {
					DEFAULT: 'oklch(var(--warning) / <alpha-value>)',
					foreground:
						'oklch(var(--warning-foreground) / <alpha-value>)',
				},
				popover: {
					DEFAULT: 'oklch(var(--popover) / <alpha-value>)',
					foreground:
						'oklch(var(--popover-foreground) / <alpha-value>)',
				},
				card: {
					DEFAULT: 'oklch(var(--card) / <alpha-value>)',
					foreground: 'oklch(var(--card-foreground) / <alpha-value>)',
				},
			},
			borderRadius: {
				lg: 'var(--radius)',
				md: 'calc(var(--radius) - 2px)',
				sm: 'calc(var(--radius) - 4px)',
			},
			fontSize: {
				'3xs': 'var(--font-size-3xs)',
				'2xs': 'var(--font-size-2xs)',
				xs: 'var(--font-size-xs)',
				sm: 'var(--font-size-sm)',
				md: 'var(--font-size-sm)',
				base: 'var(--font-size-base)',
				lg: 'var(--font-size-lg)',
				h1: 'var(--font-size-h1)',
				h2: 'var(--font-size-h2)',
				h3: 'var(--font-size-h3)',
			},
			fontWeight: {
				light: 'var(--font-weight-light)',
				normal: 'var(--font-weight-normal)',
				medium: 'var(--font-weight-medium)',
				semibold: 'var(--font-weight-semibold)',
				bold: 'var(--font-weight-bold)',
			},
		},
	},
	plugins: [require('@tailwindcss/forms')],
};

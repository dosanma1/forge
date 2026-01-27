import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { FontManagerComponent, type FontSizeOption } from './font-manager.component';
import { FontManager } from './font-manager.service';

const meta: Meta<FontManagerComponent> = {
    title: 'Organisms/Font Manager',
    component: FontManagerComponent,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [FontManagerComponent],
            providers: [FontManager],
        }),
    ],
    parameters: {
        docs: {
            description: {
                component:
                    'Font Manager component allows users to adjust the global font size of the application. Changes are persisted to localStorage and applied to the root HTML element. You can customize the available font size options by passing them as an input, including optional CSS variable mappings.',
            },
        },
    },
};

export default meta;
type Story = StoryObj<FontManagerComponent>;

export const Default: Story = {
    render: (args) => ({
        props: args,
        template: `
			<div class="space-y-6">
				<div>
					<h2 class="text-2xl font-bold mb-4">Font Manager Demo</h2>
					<p class="text-muted-foreground mb-6">
						Use the font size selector below to adjust the application's font size.
						The selected size will be persisted to localStorage.
					</p>
					<mmc-font-manager></mmc-font-manager>
				</div>
				
				<div class="mt-8 p-6 border rounded-lg bg-card">
					<h3 class="text-xl font-semibold mb-3">Sample Content</h3>
					<p class="mb-4">
						This is a sample paragraph to demonstrate how the font size changes affect
						the content. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
					</p>
					<ul class="list-disc list-inside space-y-2">
						<li>Sample list item with default styling</li>
						<li>Another item to show text scaling</li>
						<li>Third item for comparison</li>
					</ul>
					<div class="mt-4 space-x-2">
						<button class="px-4 py-2 bg-primary text-primary-foreground rounded">
							Button Text
						</button>
						<button class="px-4 py-2 bg-secondary text-secondary-foreground rounded">
							Secondary Button
						</button>
					</div>
				</div>
			</div>
		`,
    }),
};

export const WithDescription: Story = {
    render: () => ({
        template: `
			<div class="max-w-md">
				<div class="mb-4">
					<h3 class="text-lg font-semibold mb-2">Adjust Font Size</h3>
					<p class="text-sm text-muted-foreground">
						Choose a font size that's comfortable for reading. The change will
						affect the entire application.
					</p>
				</div>
				<mmc-font-manager></mmc-font-manager>
			</div>
		`,
    }),
};

export const InSettingsPanel: Story = {
    render: () => ({
        template: `
			<div class="max-w-2xl border rounded-lg bg-card">
				<div class="p-6 border-b">
					<h2 class="text-xl font-bold">Appearance Settings</h2>
					<p class="text-sm text-muted-foreground mt-1">
						Customize how the application looks and feels
					</p>
				</div>
				
				<div class="p-6 space-y-6">
					<div>
						<h3 class="text-base font-semibold mb-4">Typography</h3>
						<mmc-font-manager></mmc-font-manager>
					</div>
					
					<div class="pt-4 border-t">
						<h3 class="text-base font-semibold mb-2">Other Settings</h3>
						<p class="text-sm text-muted-foreground">
							Additional appearance settings would go here...
						</p>
					</div>
				</div>
			</div>
		`,
    }),
};

export const CustomOptions: Story = {
    render: (args) => ({
        props: args,
        template: `
			<div class="space-y-6">
				<div>
					<h2 class="text-2xl font-bold mb-4">Custom Font Size Options</h2>
					<p class="text-muted-foreground mb-6">
						This example shows how to provide custom font size options with CSS variable mappings.
						The options are linked to CSS custom properties defined in your theme.
					</p>
					<mmc-font-manager [options]="customOptions"></mmc-font-manager>
				</div>
				
				<div class="mt-8 p-6 border rounded-lg bg-card">
					<h3 class="text-xl font-semibold mb-3">CSS Variables Used</h3>
					<ul class="list-disc list-inside space-y-2 font-mono text-sm">
						<li>--font-size-sm (Smaller)</li>
						<li>--font-size-base (Default)</li>
						<li>--font-size-xl (Large)</li>
						<li>--font-size-h3 (Larger)</li>
					</ul>
				</div>
			</div>
		`,
    }),
    args: {
        options: [
            {
                label: 'Smaller',
                value: 'smaller',
                description: '12px',
                cssVariable: '--font-size-sm',
            },
            {
                label: 'Small',
                value: 'small',
                description: '14px',
            },
            {
                label: 'Default',
                value: 'default',
                description: '16px',
                cssVariable: '--font-size-base',
            },
            {
                label: 'Large',
                value: 'large',
                description: '18px',
                cssVariable: '--font-size-xl',
            },
            {
                label: 'Larger',
                value: 'larger',
                description: '20px',
                cssVariable: '--font-size-h3',
            },
        ] as FontSizeOption[],
    },
};

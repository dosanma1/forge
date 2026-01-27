import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcButton } from '../button/button.component';
import { MmcSpinner } from './spinner.component';

const meta: Meta<MmcSpinner> = {
	title: 'Atoms/Spinner',
	component: MmcSpinner,
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [MmcSpinner, MmcButton],
		}),
	],
	render: ({ ...args }) => ({
		props: args,
		template: `<mmc-spinner></mmc-spinner>`,
	}),
};

export default meta;
type Story = StoryObj<MmcSpinner>;

export const Default: Story = {};

export const Small: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `<mmc-spinner class="size-4"></mmc-spinner>`,
	}),
};

export const Large: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `<mmc-spinner class="size-12"></mmc-spinner>`,
	}),
};

export const WithText: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
			<div class="flex items-center gap-2">
				<mmc-spinner class="size-4"></mmc-spinner>
				<span>Loading...</span>
			</div>
		`,
	}),
};

export const InButton: Story = {
	name: 'In Button Context',
	render: ({ ...args }) => ({
		props: args,
		template: `
			<button mmcButton disabled>
				<mmc-spinner class="size-4"></mmc-spinner>
				Please wait
			</button>
		`,
	}),
};


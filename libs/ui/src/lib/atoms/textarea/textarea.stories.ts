import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcLabel } from '../label/label.directive';
import { MmcTextarea } from './textarea.directive';

const placeholder = 'Leave a comment';

const meta: Meta<MmcTextarea> = {
	title: 'Atoms/Textarea',
	component: MmcTextarea,
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [MmcTextarea, MmcLabel],
		}),
	],
};

export default meta;
type Story = StoryObj<MmcTextarea>;

export const Default: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
		<textarea
			mmcTextarea
			placeholder="Type something..."
			type="text"
			class="min-h-20"
		></textarea>
		`,
	}),
};

export const Disabled: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
		<textarea
			mmcTextarea
			placeholder="Type something..."
			class="min-h-20"
			disabled
		></textarea>
		`,
	}),
};

export const WithValue: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
		<textarea
			mmcTextarea
			class="min-h-20"
		>This is some pre-filled content in the textarea.</textarea>
		`,
	}),
};

export const Resizable: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
		<textarea
			mmcTextarea
			placeholder="Type something..."
			class="min-h-32 resize"
		></textarea>
		`,
	}),
};

export const WithLabel: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
		<div class="grid gap-2">
			<label mmcLabel for="message">Your message</label>
			<textarea
				mmcTextarea
				id="message"
				placeholder="Leave a comment..."
				class="min-h-24"
			></textarea>
			<p class="text-sm text-muted-foreground">
				Your message will be copied to the support team.
			</p>
		</div>
		`,
	}),
};

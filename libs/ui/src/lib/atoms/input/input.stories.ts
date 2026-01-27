import { provideIcons } from '@ng-icons/core';
import { lucideCircleHelp, lucideMail } from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcButton } from '../button/button.component';
import { MmcIcon } from '../icon/icon.component';
import { MmcLabel } from '../label/label.directive';
import { MmcInput } from './input.directive';

const emailPlaceholder = 'you@example.com';

const meta: Meta<MmcInput> = {
	title: 'Atoms/Input',
	component: MmcInput,
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [MmcLabel, MmcInput, MmcButton, MmcIcon],
			providers: [provideIcons({ lucideMail, lucideCircleHelp })],
		}),
	],
};

export default meta;
type Story = StoryObj<MmcInput>;

export const Default: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `<input mmcInput id="email" type="email" placeholder="${emailPlaceholder}"/>`,
	}),
};

export const Disabled: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `<input mmcInput type="email" placeholder="${emailPlaceholder}" disabled/>`,
	}),
};

export const WithError: Story = {
	name: 'With Error State',
	render: ({ ...args }) => ({
		props: args,
		template: `
			<div class="grid gap-2">
				<label mmcLabel for="email-error">Email</label>
				<input mmcInput id="email-error" type="email" placeholder="${emailPlaceholder}" class="border-destructive"/>
				<p class="text-sm text-destructive">Please enter a valid email address</p>
			</div>
		`,
	}),
};

export const Password: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
			<div class="grid gap-2">
				<label mmcLabel for="password">Password</label>
				<input mmcInput id="password" type="password" placeholder="Enter your password"/>
			</div>
		`,
	}),
};

export const Number: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
			<div class="grid gap-2">
				<label mmcLabel for="number">Quantity</label>
				<input mmcInput id="number" type="number" placeholder="0" min="0" max="100"/>
			</div>
		`,
	}),
};

export const WithIcon: Story = {
	name: 'With Leading Icon',
	render: ({ ...args }) => ({
		props: args,
		template: `
			<div class="relative">
				<div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
					<mmc-icon name="lucideMail" size="sm" class="text-muted-foreground"></mmc-icon>
				</div>
				<input mmcInput type="email" placeholder="${emailPlaceholder}" class="pl-10"/>
			</div>
		`,
	}),
};

export const WithButton: Story = {
	name: 'With Button',
	render: ({ ...args }) => ({
		props: args,
		template: `
			<div class="flex gap-2">
				<input mmcInput type="email" placeholder="${emailPlaceholder}" class="flex-1"/>
				<button mmcButton type="submit">Subscribe</button>
			</div>
		`,
	}),
};

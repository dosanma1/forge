import { provideIcons } from '@ng-icons/core';
import {
	lucideArrowRight,
	lucideChevronDown,
	lucideChevronLeft,
	lucideChevronUp,
	lucidePlus,
} from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcIcon } from '../icon/icon.component';
import { MmcButton } from './button.component';

type ButtonComponentPropsAndCustomArgs = MmcButton &
	Partial<{
		text: string;
	}>;

const meta: Meta<ButtonComponentPropsAndCustomArgs> = {
	title: 'Atoms/Button',
	component: MmcButton,
	tags: ['autodocs'],
	args: {
		variant: 'default',
		size: 'default',
		disabled: false,
		loading: false,
		text: 'Button',
		additionalClasses: '',
	},
	argTypes: {
		variant: {
			options: [
				'default',
				'secondary',
				'destructive',
				'outline',
				'ghost',
				'link',
			],
			control: {
				type: 'select',
			},
		},
		size: {
			options: ['default', 'sm', 'lg', 'icon'],
			control: {
				type: 'select',
			},
		},
		text: {
			control: {
				type: 'text',
			},
		},
	},
	decorators: [
		moduleMetadata({
			imports: [MmcButton, MmcIcon],
			providers: provideIcons({
				lucidePlus,
				lucideChevronLeft,
				lucideArrowRight,
				lucideChevronUp,
				lucideChevronDown,
			}),
		}),
	],
	render: ({ ...args }) => ({
		props: args,
		template: `
		<button mmcButton variant="${args.variant}" size="${args.size}" [loading]="${args.loading}" [disabled]="${args.disabled}" class="${args.additionalClasses}">
			${args.text}
		</button>`,
	}),
};

export default meta;
type Story = StoryObj<ButtonComponentPropsAndCustomArgs>;

export const Default: Story = {
	args: {
		variant: 'default',
	},
};

export const Secondary: Story = {
	args: {
		variant: 'secondary',
	},
};

export const Destructive: Story = {
	args: {
		variant: 'destructive',
	},
};

export const Outline: Story = {
	args: {
		variant: 'outline',
	},
};

export const Ghost: Story = {
	args: {
		variant: 'ghost',
	},
};

export const Link: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
		<button mmcButton variant="link" >
			<mmc-icon size="sm" name="lucideChevronLeft"></mmc-icon>
			Go back
		</button>`,
	}),
};

export const LeadingIcon: Story = {
	name: 'Button with leading icon',
	render: ({ ...args }) => ({
		props: args,
		template: `
		<button mmcButton>
			<mmc-icon size="sm" name="lucidePlus"></mmc-icon>
			Button
		</button>`,
	}),
};

export const TrailingAnimatedIcon: Story = {
	name: 'Button with trailing animated icon',
	render: ({ ...args }) => ({
		props: args,
		template: `
		<button mmcButton variant="ghost" class="group">
			${args.text}
			<mmc-icon size="sm" name="lucideArrowRight" class="-me-1 opacity-60 transition-transform group-hover:translate-x-0.5"></mmc-icon>
		</button>`,
	}),
};

export const Circular: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
		<button mmcButton size="icon" class="rounded-full">
			<mmc-icon size="sm" name="lucidePlus"></mmc-icon>
		</button>`,
	}),
};

export const Loading: Story = {
	args: {
		variant: 'default',
		loading: true,
		text: 'Processing...',
	},
};

export const Disabled: Story = {
	args: {
		disabled: true,
	},
};

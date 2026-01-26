import { provideIcons } from '@ng-icons/core';
import { lucideX, lucideZap } from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcCheckbox } from '../checkbox/checkbox.component';
import { MmcIcon } from '../icon/icon.component';
import { MmcBadge } from './badge.component';

type BadgeComponentPropsAndCustomArgs = MmcBadge &
	Partial<{
		text: string | number;
	}>;

const meta: Meta<BadgeComponentPropsAndCustomArgs> = {
	title: 'Atoms/Badge',
	component: MmcBadge,
	tags: ['autodocs'],
	args: {
		variant: 'default',
		size: 'default',
		text: 'Badge',
		removable: false,
		additionalClasses: '',
	},
	argTypes: {
		variant: {
			options: ['default', 'secondary', 'destructive', 'outline'],
			control: {
				type: 'select',
			},
		},
		size: {
			options: ['default', 'sm'],
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
			imports: [MmcBadge, MmcIcon, MmcCheckbox],
			providers: [provideIcons({ lucideZap, lucideX })],
		}),
	],
	render: ({ ...args }) => ({
		props: args,
		template: `	<mmc-badge variant="${args.variant}" size="${args.size}" class="${args.additionalClasses}" [removable]="${args.removable}">${args.text}</mmc-badge>`,
	}),
};

export default meta;
type Story = StoryObj<BadgeComponentPropsAndCustomArgs>;

export const Default: Story = {
	args: {
		variant: 'default',
		size: 'default',
	},
};

export const Secondary: Story = {
	args: {
		variant: 'secondary',
		size: 'default',
	},
};

export const Destructive: Story = {
	args: {
		variant: 'destructive',
		size: 'default',
	},
};

export const Outline: Story = {
	args: {
		variant: 'outline',
		size: 'default',
	},
};

export const Link: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `<a mmcBadge href="#">Link</a>`,
	}),
};

export const WithIcon: Story = {
	name: 'Badge with icon',
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-badge>
				<mmc-icon name="lucideZap" size="xs" class="-ms-0.5 opacity-60"></mmc-icon>
				${args.text}
			</mmc-badge>`,
	}),
};

export const WithNumber: Story = {
	name: 'Badge with number',
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-badge>
				${args.text}
				<span className="text-primary-foreground/60 text-xs font-medium">
					73
				</span>
			</mmc-badge>`,
	}),
};

export const OnlyNumber: Story = {
	name: 'Only number',
	args: {
		text: 6,
		additionalClasses: 'rounded-full',
	},
};

export const Removable: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-badge class="gap-0" [removable]="true">
				Removable
			</mmc-badge>`,
	}),
};

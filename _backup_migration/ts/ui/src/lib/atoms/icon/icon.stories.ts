import { provideIcons } from '@ng-icons/core';
import { lucideHouse } from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcIcon } from './icon.component';

const meta: Meta<MmcIcon> = {
	title: 'Atoms/Icon',
	component: MmcIcon,
	tags: ['autodocs'],
	args: {
		size: 'default',
	},
	argTypes: {
		size: {
			options: ['xs', 'sm', 'md', 'default', 'lg', 'xl', 'none'],
			control: {
				type: 'select',
			},
		},
	},
	decorators: [
		moduleMetadata({
			imports: [MmcIcon],
			providers: [provideIcons({ lucideHouse })],
		}),
	],
	render: ({ ...args }) => ({
		props: args,
		template: `<mmc-icon size="${args.size}" name="lucideHouse"></mmc-icon>`,
	}),
};

export default meta;
type Story = StoryObj<MmcIcon>;

export const ExtraSmall: Story = {
	args: {
		size: 'xs',
	},
};

export const Small: Story = {
	args: {
		size: 'sm',
	},
};

export const Medium: Story = {
	args: {
		size: 'md',
	},
};

export const Default: Story = {
	args: {
		size: 'default',
	},
};

export const Large: Story = {
	args: {
		size: 'lg',
	},
};

export const ExtraLarge: Story = {
	args: {
		size: 'xl',
	},
};

export const None: Story = {
	args: {
		size: 'none',
	},
};

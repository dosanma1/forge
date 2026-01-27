import { provideIcons } from '@ng-icons/core';
import {
	lucideCircleAlert,
	lucideCircleCheck,
	lucideTriangleAlert,
} from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { MmcAlert } from './alert.component';

const meta: Meta<MmcAlert> = {
	title: 'Molecules/Alert',
	component: MmcAlert,
	tags: ['autodocs'],
	args: {
		variant: 'default',
	},
	argTypes: {
		variant: {
			options: ['default', 'info', 'warning', 'error', 'success'],
			control: {
				type: 'select',
			},
		},
	},
	decorators: [
		moduleMetadata({
			imports: [MmcAlert, MmcIcon],
			providers: provideIcons({
				lucideTriangleAlert,
				lucideCircleAlert,
				lucideCircleCheck,
			}),
		}),
	],
};

export default meta;
type Story = StoryObj<MmcAlert>;

export const Default: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-alert [removable]="true" class="min-w-96">
				<mmc-icon size="sm" name="lucideTriangleAlert" class="mr-2 text-amber-600"></mmc-icon>
				Some information is missing!
			</mmc-alert>
		`,
	}),
};

export const Info: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-alert variant="info" class="min-w-96">
				<mmc-icon size="sm" name="lucideCircleAlert" class="mr-2 text-blue-600"></mmc-icon>
				Some information!
			</mmc-alert>
		`,
	}),
};

export const Warning: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-alert variant="warning" class="min-w-96">
				<mmc-icon size="sm" name="lucideTriangleAlert" class="mr-2 text-amber-600"></mmc-icon>
				Some information is missing!
			</mmc-alert>
		`,
	}),
};

export const Error: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-alert variant="error" class="min-w-96">
				<mmc-icon size="sm" name="lucideCircleAlert" class="mr-2 text-destructive"></mmc-icon>
				An error occurred!
			</mmc-alert>
		`,
	}),
};

export const Success: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-alert variant="success" class="min-w-96">
				<mmc-icon size="sm" name="lucideCircleAlert" class="mr-2 text-emerald-500"></mmc-icon>
				Completed successfully!
			</mmc-alert>
		`,
	}),
};

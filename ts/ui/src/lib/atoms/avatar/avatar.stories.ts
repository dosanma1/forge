import { provideIcons } from '@ng-icons/core';
import { lucideUser } from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcBadge } from '../badge/badge.component';
import { MmcIcon } from '../icon/icon.component';
import { MmcAvatarFallback } from './avatar-fallback.component';
import { MmcAvatarImage } from './avatar-image.component';
import { MmcAvatar } from './avatar.component';

const meta: Meta<MmcAvatar> = {
	title: 'Atoms/Avatar',
	component: MmcAvatar,
	decorators: [
		moduleMetadata({
			imports: [
				MmcAvatar,
				MmcAvatarImage,
				MmcAvatarFallback,
				MmcBadge,
				MmcIcon,
			],
			providers: [provideIcons({ lucideUser })],
		}),
	],
};

export default meta;
type Story = StoryObj<MmcAvatar>;

export const Default: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-avatar>
				<mmc-avatar-image [src]="'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'" [imgAlt]="'Kelly King'" />
				<mmc-avatar-fallback>KK</mmc-avatar-fallback>
			</mmc-avatar>
		`,
	}),
};

export const WithIcon: Story = {
	name: 'Avatar with icon',
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-avatar>
				<mmc-avatar-fallback>
					<mmc-icon class="opacity-60" name="lucideUser" size="sm"></mmc-icon>
				</mmc-avatar-fallback>
			</mmc-avatar>
		`,
	}),
};

export const WithBadge: Story = {
	name: 'Avatar with badge',
	render: ({ ...args }) => ({
		props: args,
		template: `
			<div class="relative">
				<mmc-avatar class="rounded-lg">
					<mmc-avatar-image [src]="'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&ixid=eyJhcHBfaWQiOjEyMDd9&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80'" [imgAlt]="'Kelly King'" />
					<mmc-avatar-fallback>KK</mmc-avatar-fallback>
				</mmc-avatar>
				<mmc-badge class="border-background absolute -top-1 left-full min-w-5 -translate-x-4 px-1 rounded-full">6</mmc-badge>
			</div>
		`,
	}),
};

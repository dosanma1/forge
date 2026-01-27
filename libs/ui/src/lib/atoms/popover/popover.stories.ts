import { Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
	lucideChevronDown,
	lucideInfo,
	lucideLogOut,
	lucideSettings,
	lucideUser,
} from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcButton } from '../button/button.component';
import { MmcIcon } from '../icon/icon.component';
import { MmcPopoverOrigin } from './popover-origin.directive';
import { MmcPopover } from './popover.component';

const meta: Meta<MmcPopover> = {
	title: 'Atoms/Popover',
	component: MmcPopover,
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<MmcPopover>;

@Component({
	selector: 'popover-default-example',
	standalone: true,
	imports: [MmcPopoverOrigin, MmcButton, MmcPopover],
	template: `
		<div class="flex justify-center p-8">
			<button
				mmcButton
				mmcPopoverOrigin
				#trigger="mmcPopoverOrigin"
				(click)="toggle()"
			>
				Open Popover
			</button>
			<mmc-popover
				[(isOpen)]="isOpen"
				[origin]="trigger"
				[offsetY]="8"
				[outsideClose]="true"
				[styled]="true"
				class="w-80"
			>
				<ng-template>
					<div class="space-y-2">
						<h3 class="font-medium text-sm">Popover Title</h3>
						<p class="text-sm text-muted-foreground">
							This is a popover component. You can put any content here.
						</p>
					</div>
				</ng-template>
			</mmc-popover>
		</div>
	`,
})
class PopoverDefaultExample {
	isOpen = signal(false);

	toggle() {
		this.isOpen.update((v) => !v);
	}
}

export const Default: Story = {
	decorators: [
		moduleMetadata({
			imports: [PopoverDefaultExample],
			providers: [provideIcons({ lucideChevronDown })],
		}),
	],
	render: () => ({
		template: `<popover-default-example />`,
	}),
};

@Component({
	selector: 'popover-user-menu-example',
	standalone: true,
	imports: [MmcPopoverOrigin, MmcButton, MmcPopover, MmcIcon],
	template: `
		<div class="flex justify-center p-8">
			<button
				mmcButton
				variant="outline"
				size="icon"
				mmcPopoverOrigin
				#trigger="mmcPopoverOrigin"
				(click)="toggle()"
			>
				<mmc-icon name="lucideUser" size="sm" />
			</button>
			<mmc-popover
				[(isOpen)]="isOpen"
				[origin]="trigger"
				[offsetY]="8"
				[outsideClose]="true"
				[styled]="true"
				class="w-56"
			>
				<ng-template>
					<div class="space-y-1">
						<button
							mmcButton
							variant="ghost"
							class="w-full justify-start gap-2"
							(click)="handleAction('profile')"
						>
							<mmc-icon name="lucideUser" size="sm" />
							Profile
						</button>
						<button
							mmcButton
							variant="ghost"
							class="w-full justify-start gap-2"
							(click)="handleAction('settings')"
						>
							<mmc-icon name="lucideSettings" size="sm" />
							Settings
						</button>
						<div class="h-px bg-border my-1"></div>
						<button
							mmcButton
							variant="ghost"
							class="w-full justify-start gap-2 text-destructive hover:text-destructive"
							(click)="handleAction('logout')"
						>
							<mmc-icon name="lucideLogOut" size="sm" />
							Log out
						</button>
					</div>
				</ng-template>
			</mmc-popover>
		</div>
	`,
})
class PopoverUserMenuExample {
	isOpen = signal(false);

	toggle() {
		this.isOpen.update((v) => !v);
	}

	handleAction(action: string) {
		console.log('Action:', action);
		this.isOpen.set(false);
	}
}

export const UserMenu: Story = {
	decorators: [
		moduleMetadata({
			imports: [PopoverUserMenuExample],
			providers: [
				provideIcons({
					lucideUser,
					lucideSettings,
					lucideLogOut,
				}),
			],
		}),
	],
	render: () => ({
		template: `<popover-user-menu-example />`,
	}),
};

@Component({
	selector: 'popover-info-example',
	standalone: true,
	imports: [MmcPopoverOrigin, MmcButton, MmcPopover, MmcIcon],
	template: `
		<div class="flex justify-center p-8">
			<div class="flex items-center gap-2">
				<span class="text-sm">Hover for more info</span>
				<button
					mmcButton
					variant="ghost"
					size="icon"
					mmcPopoverOrigin
					#trigger="mmcPopoverOrigin"
					(mouseenter)="isOpen.set(true)"
					(mouseleave)="isOpen.set(false)"
					class="h-5 w-5 p-0"
				>
					<mmc-icon name="lucideInfo" size="xs" />
				</button>
			</div>
			<mmc-popover
				[(isOpen)]="isOpen"
				[origin]="trigger"
				[offsetY]="8"
				[outsideClose]="false"
				[styled]="true"
				class="w-72"
			>
				<ng-template>
					<div class="space-y-2">
						<h4 class="font-medium text-sm">Additional Information</h4>
						<p class="text-xs text-muted-foreground">
							This popover appears on hover and provides contextual information to help users understand the feature better.
						</p>
					</div>
				</ng-template>
			</mmc-popover>
		</div>
	`,
})
class PopoverInfoExample {
	isOpen = signal(false);
}

export const InfoPopover: Story = {
	decorators: [
		moduleMetadata({
			imports: [PopoverInfoExample],
			providers: [provideIcons({ lucideInfo })],
		}),
	],
	render: () => ({
		template: `<popover-info-example />`,
	}),
};

import { provideIcons } from '@ng-icons/core';
import {
	lucideBell,
	lucideHouse,
	lucideInbox,
	lucidePencil,
	lucideSettings,
	lucideUser,
} from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcTab } from './tab.component';
import { MmcTabs } from './tabs.component';

const meta: Meta<MmcTabs> = {
	title: 'Molecules/Tab',
	component: MmcTabs,
	tags: ['autodocs'],
	parameters: {
		layout: 'padded',
	},
	decorators: [
		moduleMetadata({
			imports: [MmcTabs, MmcTab],
			providers: [
				provideIcons({
					lucidePencil,
					lucideHouse,
					lucideSettings,
					lucideUser,
					lucideBell,
					lucideInbox,
				}),
			],
		}),
	],
};

export default meta;
type Story = StoryObj<MmcTabs>;

export const PillHorizontal: Story = {
	render: () => ({
		template: `
			<mmc-tabs variant="pill" class="w-full">
				<mmc-tab name="Dashboard" icon="lucideHouse" [templateRef]="tab1"></mmc-tab>
				<mmc-tab name="Profile" icon="lucideUser" [templateRef]="tab2"></mmc-tab>
				<mmc-tab name="Settings" icon="lucideSettings" [templateRef]="tab3"></mmc-tab>
			</mmc-tabs>

			<ng-template #tab1>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Dashboard</h3>
					<p class="text-muted-foreground">View your dashboard with key metrics and insights.</p>
				</div>
			</ng-template>
			<ng-template #tab2>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Profile</h3>
					<p class="text-muted-foreground">Manage your profile information and preferences.</p>
				</div>
			</ng-template>
			<ng-template #tab3>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Settings</h3>
					<p class="text-muted-foreground">Configure application settings and preferences.</p>
				</div>
			</ng-template>
		`,
	}),
};

export const PillVertical: Story = {
	render: () => ({
		template: `
			<div class="flex h-[400px]">
				<mmc-tabs orientation="vertical" variant="pill" class="h-full">
					<mmc-tab name="Profile" icon="lucideUser" [templateRef]="tab1"></mmc-tab>
					<mmc-tab name="Security" [templateRef]="tab2"></mmc-tab>
					<mmc-tab name="Notifications" icon="lucideBell" [templateRef]="tab3"></mmc-tab>
					<mmc-tab name="Preferences" [templateRef]="tab4"></mmc-tab>
				</mmc-tabs>
			</div>

			<ng-template #tab1>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Profile</h3>
					<p class="text-muted-foreground">Manage your profile information and public visibility.</p>
				</div>
			</ng-template>
			<ng-template #tab2>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Security</h3>
					<p class="text-muted-foreground">Update your password and secure your account.</p>
				</div>
			</ng-template>
			<ng-template #tab3>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Notifications</h3>
					<p class="text-muted-foreground">Choose how you receive notifications.</p>
				</div>
			</ng-template>
			<ng-template #tab4>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Preferences</h3>
					<p class="text-muted-foreground">Customize your experience.</p>
				</div>
			</ng-template>
		`,
	}),
};

export const UnderlinedHorizontal: Story = {
	render: () => ({
		template: `
			<mmc-tabs variant="underlined" class="w-full">
				<mmc-tab name="Home" icon="lucideHouse" [templateRef]="tab1"></mmc-tab>
				<mmc-tab name="Notifications" icon="lucideBell" badge="3" [templateRef]="tab2"></mmc-tab>
				<mmc-tab name="Messages" icon="lucideInbox" badge="12" [templateRef]="tab3"></mmc-tab>
			</mmc-tabs>

			<ng-template #tab1>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Home</h3>
					<p class="text-muted-foreground">Welcome back! Here's what's happening today.</p>
				</div>
			</ng-template>
			<ng-template #tab2>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Notifications</h3>
					<p class="text-muted-foreground">You have 3 new notifications.</p>
				</div>
			</ng-template>
			<ng-template #tab3>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Messages</h3>
					<p class="text-muted-foreground">You have 12 unread messages.</p>
				</div>
			</ng-template>
		`,
	}),
};

export const UnderlinedVertical: Story = {
	render: () => ({
		template: `
			<div class="flex h-[400px]">
				<mmc-tabs orientation="vertical" variant="underlined" class="h-full">
					<mmc-tab name="Account" icon="lucideUser" [templateRef]="tab1"></mmc-tab>
					<mmc-tab name="Password" [templateRef]="tab2"></mmc-tab>
					<mmc-tab name="Billing" icon="lucideSettings" [templateRef]="tab3"></mmc-tab>
				</mmc-tabs>
			</div>

			<ng-template #tab1>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Account</h3>
					<p class="text-muted-foreground">Manage your account details.</p>
				</div>
			</ng-template>
			<ng-template #tab2>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Password</h3>
					<p class="text-muted-foreground">Change your password.</p>
				</div>
			</ng-template>
			<ng-template #tab3>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Billing</h3>
					<p class="text-muted-foreground">Manage billing and subscriptions.</p>
				</div>
			</ng-template>
		`,
	}),
};

export const WithIconsAndBadges: Story = {
	render: () => ({
		template: `
			<mmc-tabs variant="pill" class="w-full">
				<mmc-tab name="Inbox" icon="lucideInbox" badge="5" [templateRef]="tab1"></mmc-tab>
				<mmc-tab name="Drafts" icon="lucidePencil" badge="2" [templateRef]="tab2"></mmc-tab>
				<mmc-tab name="Settings" icon="lucideSettings" [templateRef]="tab3"></mmc-tab>
			</mmc-tabs>

			<ng-template #tab1>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Inbox</h3>
					<p class="text-muted-foreground">You have 5 new messages in your inbox.</p>
				</div>
			</ng-template>
			<ng-template #tab2>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Drafts</h3>
					<p class="text-muted-foreground">You have 2 draft messages.</p>
				</div>
			</ng-template>
			<ng-template #tab3>
				<div class="p-6">
					<h3 class="text-lg font-semibold mb-2">Settings</h3>
					<p class="text-muted-foreground">Configure your mail settings.</p>
				</div>
			</ng-template>
		`,
	}),
};

export const Scrollable: Story = {
	render: () => ({
		template: `
			<div class="w-[600px]">
				<mmc-tabs variant="underlined" [scrollable]="true" class="w-full">
					<mmc-tab name="Dashboard" icon="lucideHouse" [templateRef]="tab1"></mmc-tab>
					<mmc-tab name="Analytics" [templateRef]="tab2"></mmc-tab>
					<mmc-tab name="Reports" [templateRef]="tab3"></mmc-tab>
					<mmc-tab name="Settings" icon="lucideSettings" [templateRef]="tab4"></mmc-tab>
					<mmc-tab name="Users" icon="lucideUser" [templateRef]="tab5"></mmc-tab>
					<mmc-tab name="Notifications" icon="lucideBell" badge="99+" [templateRef]="tab6"></mmc-tab>
					<mmc-tab name="Messages" icon="lucideInbox" badge="5" [templateRef]="tab7"></mmc-tab>
					<mmc-tab name="Profile" [templateRef]="tab8"></mmc-tab>
				</mmc-tabs>
			</div>

			<ng-template #tab1>
				<div class="p-6"><p class="text-muted-foreground">Dashboard content</p></div>
			</ng-template>
			<ng-template #tab2>
				<div class="p-6"><p class="text-muted-foreground">Analytics content</p></div>
			</ng-template>
			<ng-template #tab3>
				<div class="p-6"><p class="text-muted-foreground">Reports content</p></div>
			</ng-template>
			<ng-template #tab4>
				<div class="p-6"><p class="text-muted-foreground">Settings content</p></div>
			</ng-template>
			<ng-template #tab5>
				<div class="p-6"><p class="text-muted-foreground">Users content</p></div>
			</ng-template>
			<ng-template #tab6>
				<div class="p-6"><p class="text-muted-foreground">Notifications content</p></div>
			</ng-template>
			<ng-template #tab7>
				<div class="p-6"><p class="text-muted-foreground">Messages content</p></div>
			</ng-template>
			<ng-template #tab8>
				<div class="p-6"><p class="text-muted-foreground">Profile content</p></div>
			</ng-template>
		`,
	}),
};

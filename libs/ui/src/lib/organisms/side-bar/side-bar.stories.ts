import { RouterModule } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import {
	lucideChartArea,
	lucideChevronLeft,
	lucideCircleHelp,
	lucideDatabase,
	lucideFileText,
	lucideFolder,
	lucideInbox,
	lucideSettings,
	lucideUserRoundPlus,
	lucideUsers,
} from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { SideBarComponent } from './side-bar.component';
import { SideBarService } from './side-bar.service';

const meta: Meta<SideBarComponent> = {
	title: 'Organisms/Side Bar',
	component: SideBarComponent,
	tags: ['autodocs'],
	parameters: {
		layout: 'fullscreen',
		docs: {
			description: {
				component: 'A collapsible sidebar navigation component with support for basic links, collapsable sections, and grouped items.',
			},
		},
	},
	decorators: [
		moduleMetadata({
			imports: [RouterModule, SideBarComponent],
			providers: [
				SideBarService,
				provideIcons({
					lucideChartArea,
					lucideInbox,
					lucideSettings,
					lucideUserRoundPlus,
					lucideCircleHelp,
					lucideChevronLeft,
					lucideFolder,
					lucideUsers,
					lucideFileText,
					lucideDatabase,
				}),
			],
		}),
	],
};

export default meta;
type Story = StoryObj<SideBarComponent>;

export const Default: Story = {
	args: {
		navigation: [
			{
				id: 'dashboard',
				title: 'Dashboard',
				type: 'basic',
				icon: 'lucideChartArea',
			},
			{
				id: 'notifications',
				title: 'Notifications',
				type: 'basic',
				icon: 'lucideInbox',
				badge: { title: '3' },
			},
		],
		footer: [
			{
				id: 'settings',
				title: 'Settings',
				type: 'basic',
				icon: 'lucideSettings',
			},
			{
				id: 'documentation',
				title: 'Help',
				type: 'basic',
				icon: 'lucideCircleHelp',
			},
		],
	},
	render: (args) => ({
		props: args,
		template: `
			<div class="h-[720px] flex bg-background">
				<mmc-side-bar class="flex" [navigation]="navigation" [footer]="footer">
					<div sideBarContentHeaderExpanded class="flex items-center gap-2">
						<div class="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
							<span class="text-primary-foreground font-bold text-sm">A</span>
						</div>
						<span class="font-semibold">App Name</span>
					</div>
					<div sideBarContentHeaderCollapsed class="flex items-center justify-center w-full">
						<div class="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
							<span class="text-primary-foreground font-bold text-sm">A</span>
						</div>
					</div>
				</mmc-side-bar>
				<div class="flex-1 p-8 border-l border-border">
					<h1 class="text-2xl font-bold mb-4">Main Content Area</h1>
					<p class="text-muted-foreground">Click the sidebar items or toggle button to interact with the sidebar.</p>
				</div>
			</div>
		`,
	}),
};

export const WithGroups: Story = {
	args: {
		navigation: [
			{
				id: 'dashboard',
				title: 'Dashboard',
				type: 'basic',
				icon: 'lucideChartArea',
			},
			{
				id: 'workspace',
				title: 'Workspace',
				type: 'group',
				children: [
					{
						id: 'projects',
						title: 'Projects',
						type: 'basic',
						icon: 'lucideFolder',
					},
					{
						id: 'team',
						title: 'Team',
						type: 'basic',
						icon: 'lucideUsers',
					},
					{
						id: 'documents',
						title: 'Documents',
						type: 'basic',
						icon: 'lucideFileText',
						badge: { title: '12' },
					},
				],
			},
			{
				id: 'data',
				title: 'Data',
				type: 'group',
				children: [
					{
						id: 'database',
						title: 'Database',
						type: 'basic',
						icon: 'lucideDatabase',
					},
				],
			},
		],
		footer: [
			{
				id: 'settings',
				title: 'Settings',
				type: 'basic',
				icon: 'lucideSettings',
			},
			{
				id: 'help',
				title: 'Help & Support',
				type: 'basic',
				icon: 'lucideCircleHelp',
			},
		],
	},
	render: (args) => ({
		props: args,
		template: `
			<div class="h-[720px] flex bg-background">
				<mmc-side-bar class="flex" [navigation]="navigation" [footer]="footer">
					<div sideBarContentHeaderExpanded class="flex items-center gap-2">
						<div class="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
							<span class="text-white font-bold text-sm">W</span>
						</div>
						<div class="flex flex-col">
							<span class="font-semibold text-sm">Workspace</span>
							<span class="text-xs text-muted-foreground">Pro Plan</span>
						</div>
					</div>
					<div sideBarContentHeaderCollapsed class="flex items-center justify-center w-full">
						<div class="h-8 w-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
							<span class="text-white font-bold text-sm">W</span>
						</div>
					</div>
				</mmc-side-bar>
				<div class="flex-1 p-8 border-l border-border">
					<h1 class="text-2xl font-bold mb-4">Sidebar with Grouped Items</h1>
					<p class="text-muted-foreground mb-4">This sidebar includes grouped navigation items for better organization.</p>
					<div class="space-y-4">
						<div class="p-4 border rounded-lg">
							<h3 class="font-semibold mb-2">Feature: Grouped Navigation</h3>
							<p class="text-sm text-muted-foreground">Items are organized into logical groups like "Workspace" and "Data".</p>
						</div>
						<div class="p-4 border rounded-lg">
							<h3 class="font-semibold mb-2">Feature: Badges</h3>
							<p class="text-sm text-muted-foreground">Some items show notification badges (e.g., "Documents" has 12 items).</p>
						</div>
					</div>
				</div>
			</div>
		`,
	}),
};

export const NotCollapsible: Story = {
	args: {
		collapsible: false,
		navigation: [
			{
				id: 'dashboard',
				title: 'Dashboard',
				type: 'basic',
				icon: 'lucideChartArea',
			},
			{
				id: 'inbox',
				title: 'Inbox',
				type: 'basic',
				icon: 'lucideInbox',
				badge: { title: '5' },
			},
			{
				id: 'team',
				title: 'Team',
				type: 'basic',
				icon: 'lucideUsers',
			},
		],
		footer: [
			{
				id: 'settings',
				title: 'Settings',
				type: 'basic',
				icon: 'lucideSettings',
			},
		],
	},
	render: (args) => ({
		props: args,
		template: `
			<div class="h-[720px] flex bg-background">
				<mmc-side-bar class="flex" [navigation]="navigation" [footer]="footer" [collapsible]="false">
					<div sideBarContentHeaderExpanded class="flex items-center gap-2">
						<div class="h-8 w-8 rounded-lg bg-green-500 flex items-center justify-center">
							<span class="text-white font-bold text-sm">F</span>
						</div>
						<span class="font-semibold">Fixed Sidebar</span>
					</div>
				</mmc-side-bar>
				<div class="flex-1 p-8 border-l border-border">
					<h1 class="text-2xl font-bold mb-4">Non-Collapsible Sidebar</h1>
					<p class="text-muted-foreground">This sidebar cannot be collapsed and remains always visible.</p>
				</div>
			</div>
		`,
	}),
};

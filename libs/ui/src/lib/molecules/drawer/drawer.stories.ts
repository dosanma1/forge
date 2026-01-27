import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideBell, lucideSettings, lucideUser, lucideX } from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { MmcInput } from '../../atoms/input/input.directive';
import { MmcLabel } from '../../atoms/label/label.directive';
import { MmcSwitch } from '../../atoms/switch/switch.component';
import { MmcDrawerClose } from './drawer-close.directive';
import { DRAWER_DATA } from './drawer-ref';
import { MmcDrawer } from './drawer.component';
import { MmcDrawerService } from './drawer.service';

// Profile Edit Component
@Component({
	selector: 'mmc-drawer-profile',
	imports: [MmcDrawerClose, MmcButton, MmcInput, MmcLabel, MmcIcon, ReactiveFormsModule],
	providers: [provideIcons({ lucideX })],
	template: `
		<div class="flex flex-col h-full">
			<div class="flex items-center justify-between p-4 border-b">
				<h2 class="text-lg font-semibold">Edit Profile</h2>
				<button mmcButton variant="ghost" size="icon" [mmcDrawerClose]="null">
					<mmc-icon name="lucideX" size="sm" />
				</button>
			</div>
			
			<div class="flex-1 overflow-y-auto p-4">
				<form [formGroup]="profileForm" class="space-y-4">
					<div class="space-y-2">
						<label mmcLabel for="name">Full Name</label>
						<input mmcInput id="name" formControlName="name" placeholder="Enter your name" />
					</div>
					
					<div class="space-y-2">
						<label mmcLabel for="email">Email</label>
						<input mmcInput id="email" type="email" formControlName="email" placeholder="your@email.com" />
					</div>
					
					<div class="space-y-2">
						<label mmcLabel for="bio">Bio</label>
						<textarea mmcTextarea id="bio" formControlName="bio" placeholder="Tell us about yourself" rows="4"></textarea>
					</div>
					
					<div class="space-y-2">
						<label mmcLabel for="website">Website</label>
						<input mmcInput id="website" formControlName="website" placeholder="https://example.com" />
					</div>
				</form>
			</div>
			
			<div class="flex justify-end gap-2 p-4 border-t">
				<button mmcButton variant="outline" [mmcDrawerClose]="null">Cancel</button>
				<button mmcButton (click)="saveProfile()">Save Changes</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerProfileComponent {
	public readonly data = inject<{ name: string; email: string }>(DRAWER_DATA, { optional: true });

	profileForm = new FormGroup({
		name: new FormControl(this.data?.name || 'John Doe', Validators.required),
		email: new FormControl(this.data?.email || 'john@example.com', [Validators.required, Validators.email]),
		bio: new FormControl('Software developer passionate about creating great user experiences.'),
		website: new FormControl('https://example.com'),
	});

	saveProfile() {
		if (this.profileForm.valid) {
			console.log('Profile saved:', this.profileForm.value);
			alert('Profile updated successfully!');
		}
	}
}

// Settings Component
@Component({
	selector: 'mmc-drawer-settings',
	imports: [MmcDrawerClose, MmcButton, MmcSwitch, MmcLabel, MmcIcon],
	providers: [provideIcons({ lucideX })],
	template: `
		<div class="flex flex-col h-full">
			<div class="flex items-center justify-between p-4 border-b">
				<h2 class="text-lg font-semibold">Settings</h2>
				<button mmcButton variant="ghost" size="icon" [mmcDrawerClose]="null">
					<mmc-icon name="lucideX" size="sm" />
				</button>
			</div>
			
			<div class="flex-1 overflow-y-auto p-4 space-y-6">
				<div>
					<h3 class="text-sm font-medium mb-3">Notifications</h3>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<div class="space-y-0.5">
								<label mmcLabel class="text-sm font-normal">Email Notifications</label>
								<p class="text-xs text-muted-foreground">Receive emails about your account activity</p>
							</div>
							<mmc-switch [(checked)]="emailNotifications" />
						</div>
						<div class="flex items-center justify-between">
							<div class="space-y-0.5">
								<label mmcLabel class="text-sm font-normal">Push Notifications</label>
								<p class="text-xs text-muted-foreground">Get push notifications on your device</p>
							</div>
							<mmc-switch [(checked)]="pushNotifications" />
						</div>
						<div class="flex items-center justify-between">
							<div class="space-y-0.5">
								<label mmcLabel class="text-sm font-normal">Marketing Emails</label>
								<p class="text-xs text-muted-foreground">Receive emails about new features and updates</p>
							</div>
							<mmc-switch [(checked)]="marketingEmails" />
						</div>
					</div>
				</div>
				
				<div>
					<h3 class="text-sm font-medium mb-3">Privacy</h3>
					<div class="space-y-3">
						<div class="flex items-center justify-between">
							<div class="space-y-0.5">
								<label mmcLabel class="text-sm font-normal">Profile Visibility</label>
								<p class="text-xs text-muted-foreground">Make your profile visible to others</p>
							</div>
							<mmc-switch [(checked)]="publicProfile" />
						</div>
						<div class="flex items-center justify-between">
							<div class="space-y-0.5">
								<label mmcLabel class="text-sm font-normal">Show Activity</label>
								<p class="text-xs text-muted-foreground">Display your recent activity</p>
							</div>
							<mmc-switch [(checked)]="showActivity" />
						</div>
					</div>
				</div>
			</div>
			
			<div class="flex justify-end gap-2 p-4 border-t">
				<button mmcButton variant="outline" [mmcDrawerClose]="null">Cancel</button>
				<button mmcButton (click)="saveSettings()">Save Settings</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerSettingsComponent {
	emailNotifications = signal(true);
	pushNotifications = signal(false);
	marketingEmails = signal(false);
	publicProfile = signal(true);
	showActivity = signal(true);

	saveSettings() {
		console.log('Settings saved:', {
			emailNotifications: this.emailNotifications(),
			pushNotifications: this.pushNotifications(),
			marketingEmails: this.marketingEmails(),
			publicProfile: this.publicProfile(),
			showActivity: this.showActivity(),
		});
		alert('Settings saved successfully!');
	}
}

// Notification Details Component
@Component({
	selector: 'mmc-drawer-notification',
	imports: [MmcDrawerClose, MmcButton, MmcIcon],
	providers: [provideIcons({ lucideX, lucideBell })],
	template: `
		<div class="flex flex-col h-full">
			<div class="flex items-center justify-between p-4 border-b">
				<h2 class="text-lg font-semibold">Notification Details</h2>
				<button mmcButton variant="ghost" size="icon" [mmcDrawerClose]="null">
					<mmc-icon name="lucideX" size="sm" />
				</button>
			</div>
			
			<div class="flex-1 overflow-y-auto p-4">
				<div class="flex items-start gap-3">
					<div class="rounded-full bg-primary/10 p-2">
						<mmc-icon name="lucideBell" size="md" class="text-primary" />
					</div>
					<div class="flex-1 space-y-3">
						<div>
							<h3 class="font-medium">{{ notification.title }}</h3>
							<p class="text-sm text-muted-foreground mt-1">{{ notification.message }}</p>
						</div>
						<div class="text-xs text-muted-foreground">
							{{ notification.time }}
						</div>
					</div>
				</div>
			</div>
			
			<div class="flex justify-end gap-2 p-4 border-t">
				<button mmcButton variant="outline" [mmcDrawerClose]="null">Close</button>
				<button mmcButton (click)="markAsRead()">Mark as Read</button>
			</div>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DrawerNotificationComponent {
	public readonly notification = inject<{ title: string; message: string; time: string }>(DRAWER_DATA);

	markAsRead() {
		console.log('Marked as read');
		alert('Notification marked as read!');
	}
}

// Story Showcase Components
@Component({
	selector: 'mmc-showcase-drawer-profile',
	imports: [MmcButton, MmcIcon],
	providers: [provideIcons({ lucideUser })],
	template: `
		<button mmcButton (click)="openDrawer()">
			<mmc-icon name="lucideUser" size="sm" />
			Edit Profile
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowcaseDrawerProfileComponent {
	private readonly drawerService = inject(MmcDrawerService);

	openDrawer() {
		this.drawerService.open(DrawerProfileComponent, {
			data: {
				name: 'Jane Smith',
				email: 'jane@example.com',
			},
		});
	}
}

@Component({
	selector: 'mmc-showcase-drawer-settings',
	imports: [MmcButton, MmcIcon],
	providers: [provideIcons({ lucideSettings })],
	template: `
		<button mmcButton variant="outline" (click)="openDrawer()">
			<mmc-icon name="lucideSettings" size="sm" />
			Settings
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowcaseDrawerSettingsComponent {
	private readonly drawerService = inject(MmcDrawerService);

	openDrawer() {
		this.drawerService.open(DrawerSettingsComponent, {});
	}
}

@Component({
	selector: 'mmc-showcase-drawer-notification',
	imports: [MmcButton, MmcIcon],
	providers: [provideIcons({ lucideBell })],
	template: `
		<button mmcButton variant="secondary" (click)="openDrawer()">
			<mmc-icon name="lucideBell" size="sm" />
			View Notification
		</button>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowcaseDrawerNotificationComponent {
	private readonly drawerService = inject(MmcDrawerService);

	openDrawer() {
		this.drawerService.open(DrawerNotificationComponent, {
			data: {
				title: 'New Feature Released',
				message: 'We\'ve just released a new feature that allows you to customize your dashboard. Check it out now!',
				time: '2 minutes ago',
			},
		});
	}
}

const meta: Meta<MmcDrawer> = {
	title: 'Molecules/Drawer',
	component: MmcDrawer,
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [
				ShowcaseDrawerProfileComponent,
				ShowcaseDrawerSettingsComponent,
				ShowcaseDrawerNotificationComponent,
			],
			providers: [MmcDrawerService],
		}),
	],
};

export default meta;
type Story = StoryObj<MmcDrawer>;

export const ProfileEdit: Story = {
	render: () => ({
		template: '<mmc-showcase-drawer-profile></mmc-showcase-drawer-profile>',
	}),
};

export const Settings: Story = {
	render: () => ({
		template: '<mmc-showcase-drawer-settings></mmc-showcase-drawer-settings>',
	}),
};

export const Notification: Story = {
	render: () => ({
		template: '<mmc-showcase-drawer-notification></mmc-showcase-drawer-notification>',
	}),
};

export const MultipleOptions: Story = {
	render: () => ({
		template: `
			<div class="flex gap-3">
				<mmc-showcase-drawer-profile></mmc-showcase-drawer-profile>
				<mmc-showcase-drawer-settings></mmc-showcase-drawer-settings>
				<mmc-showcase-drawer-notification></mmc-showcase-drawer-notification>
			</div>
		`,
	}),
};

import { Component, inject } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcConfirmationDialogService } from './confirmation-dialog.service';

@Component({
	selector: 'confirmation-dialog-story',
	template: `
		<div class="space-y-4 p-6">
			<div class="space-y-2">
				<h3 class="text-lg font-semibold">Confirmation Dialogs</h3>
				<p class="text-sm text-muted-foreground">Click the buttons below to see different dialog variants</p>
			</div>
			
			<div class="flex flex-wrap gap-3">
				<button mmcButton (click)="openBasicDialog()">
					Basic Dialog
				</button>

				<button mmcButton variant="secondary" (click)="openConfirmDialog()">
					Confirmation Dialog
				</button>

				<button
					mmcButton
					(click)="openDestructiveDialog()"
					variant="destructive"
				>
					Delete Action
				</button>

				<button
					mmcButton
					(click)="openConfirmationInputDialog()"
					variant="destructive"
				>
					Delete with Verification
				</button>
				
				<button
					mmcButton
					(click)="openLogoutDialog()"
					variant="outline"
				>
					Logout
				</button>
			</div>
		</div>
	`,
	imports: [MmcButton],
})
class ConfirmationDialogStoryComponent {
	private confirmationDialogService = inject(MmcConfirmationDialogService);

	openBasicDialog() {
		const dialogRef = this.confirmationDialogService.open(null, {
			title: 'Information',
			description: 'This is a basic dialog with custom content. You can display any information here.',
			showHeader: true,
			showFooter: true,
		});

		dialogRef.closed.subscribe((result) => {
			console.log('Dialog closed with result:', result);
		});
	}

	openConfirmDialog() {
		const dialogRef = this.confirmationDialogService.confirm({
			title: 'Confirm Action',
			description:
				'Are you sure you want to continue? This action cannot be undone.',
			confirmText: 'Yes, Continue',
			cancelText: 'Cancel',
		});

		dialogRef.closed.subscribe((result) => {
			if (result) {
				console.log('User confirmed the action');
			} else {
				console.log('User cancelled');
			}
		});
	}

	openDestructiveDialog() {
		const dialogRef = this.confirmationDialogService.confirm({
			title: 'Delete Workspace',
			description:
				'Are you sure you want to delete "My Workspace"? All projects, files, and data will be permanently removed. This action cannot be undone.',
			confirmText: 'Delete Workspace',
			cancelText: 'Keep Workspace',
			variant: 'destructive',
		});

		dialogRef.closed.subscribe((result) => {
			if (result) {
				console.log('Workspace deleted');
				alert('Workspace has been deleted!');
			}
		});
	}

	openConfirmationInputDialog() {
		const dialogRef = this.confirmationDialogService.confirm({
			title: 'Delete "Production Database"',
			description:
				'⚠️ WARNING: This will permanently delete the production database and all its data. This action cannot be undone and may affect live services.',
			confirmText: 'Delete Database',
			cancelText: 'Cancel',
			variant: 'destructive',
			requireConfirmation: true,
			confirmationValue: 'DELETE',
			confirmationPlaceholder: 'Type DELETE to confirm',
			confirmationLabel:
				'To confirm deletion, type "DELETE" in the box below:',
		});

		dialogRef.closed.subscribe((result) => {
			if (result) {
				console.log('Database deletion confirmed');
				alert('Database has been deleted!');
			}
		});
	}

	openLogoutDialog() {
		const dialogRef = this.confirmationDialogService.confirm({
			title: 'Logout',
			description:
				'Are you sure you want to logout? Any unsaved changes will be lost.',
			confirmText: 'Logout',
			cancelText: 'Stay Logged In',
		});

		dialogRef.closed.subscribe((result) => {
			if (result) {
				console.log('User logged out');
				alert('You have been logged out');
			}
		});
	}
}

const meta: Meta<ConfirmationDialogStoryComponent> = {
	title: 'Molecules/Confirmation Dialog',
	component: ConfirmationDialogStoryComponent,
	parameters: {
		layout: 'centered',
	},
	tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<ConfirmationDialogStoryComponent>;

export const Default: Story = {};

export const ConfirmationDialog: Story = {
	render: () => ({
		template: `
			<button mmcButton (click)="openConfirmDialog()">
				Open Confirmation Dialog
			</button>
		`,
		component: ConfirmationDialogStoryComponent,
	}),
};

export const DestructiveDialog: Story = {
	render: () => ({
		template: `
			<button mmcButton (click)="openDestructiveDialog()" variant="destructive">
				Open Delete Dialog
			</button>
		`,
		component: ConfirmationDialogStoryComponent,
	}),
};

export const ConfirmationInputDialog: Story = {
	render: () => ({
		template: `
			<button mmcButton (click)="openConfirmationInputDialog()" variant="destructive">
				Delete with Confirmation Input
			</button>
		`,
		component: ConfirmationDialogStoryComponent,
	}),
};

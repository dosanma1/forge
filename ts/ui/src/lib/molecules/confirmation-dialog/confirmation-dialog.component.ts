import { ComponentType } from '@angular/cdk/portal';
import { NgComponentOutlet } from '@angular/common';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	signal,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideTriangleAlert, lucideX } from '@ng-icons/lucide';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { MmcInput } from '../../atoms/input/input.directive';
import { MmcAlert } from '../alert/alert.component';
import { MmcConfirmationDialogClose } from './confirmation-dialog-close.directive';

@Component({
	selector: 'mmc-confirmation-dialog',
	imports: [
		NgComponentOutlet,
		MmcConfirmationDialogClose,
		MmcIcon,
		MmcButton,
		MmcInput,
		MmcAlert,
		FormsModule,
	],
	templateUrl: './confirmation-dialog.component.html',
	styleUrl: './confirmation-dialog.component.scss',
	viewProviders: [
		provideIcons({
			lucideX,
			lucideTriangleAlert,
		}),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcConfirmationDialog {
	public component = signal<ComponentType<unknown> | null>(null);
	public title = signal<string>('');
	public description = signal<string>('');
	public showHeader = signal<boolean>(true);
	public showFooter = signal<boolean>(false);
	public confirmText = signal<string>('Confirm');
	public cancelText = signal<string>('Cancel');
	public variant = signal<'default' | 'destructive'>('default');

	// Confirmation input properties
	public requireConfirmation = signal<boolean>(false);
	public confirmationValue = signal<string>('');
	public confirmationPlaceholder = signal<string>('');
	public confirmationLabel = signal<string>('');
	public userInput = signal<string>('');

	// Computed property to check if confirm button should be enabled
	public isConfirmEnabled = computed(() => {
		if (!this.requireConfirmation()) {
			return true;
		}
		return this.userInput().trim() === this.confirmationValue().trim();
	});

	public setComponent(component: ComponentType<unknown>): void {
		this.component.set(component);
	}

	public setTitle(title: string): void {
		this.title.set(title);
	}

	public setDescription(description: string): void {
		this.description.set(description);
	}

	public setShowHeader(show: boolean): void {
		this.showHeader.set(show);
	}

	public setShowFooter(show: boolean): void {
		this.showFooter.set(show);
	}

	public setConfirmText(text: string): void {
		this.confirmText.set(text);
	}

	public setCancelText(text: string): void {
		this.cancelText.set(text);
	}

	public setVariant(variant: 'default' | 'destructive'): void {
		this.variant.set(variant);
	}

	public setRequireConfirmation(require: boolean): void {
		this.requireConfirmation.set(require);
	}

	public setConfirmationValue(value: string): void {
		this.confirmationValue.set(value);
	}

	public setConfirmationPlaceholder(placeholder: string): void {
		this.confirmationPlaceholder.set(placeholder);
	}

	public setConfirmationLabel(label: string): void {
		this.confirmationLabel.set(label);
	}

	public onUserInputChange(value: string): void {
		this.userInput.set(value);
	}
}

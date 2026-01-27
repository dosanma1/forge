import {
    ChangeDetectionStrategy,
    Component,
    inject,
    input,
    output,
    signal,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideInfo } from '@ng-icons/lucide';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { MmcConfirmationDialogService } from '../../molecules/confirmation-dialog/confirmation-dialog.service';

@Component({
    selector: 'mmc-unsaved-changes',
    standalone: true,
    imports: [MmcButton, MmcIcon],
    templateUrl: './unsaved-changes.component.html',
    styleUrl: './unsaved-changes.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    viewProviders: [provideIcons({ lucideInfo })],
})
export class MmcUnsavedChanges {
    private readonly confirmationDialogService = inject(MmcConfirmationDialogService);

    // Inputs
    public hasUnsavedChanges = input<boolean>(false);
    public mode = input<'dialog' | 'banner'>('dialog');
    public dialogMode = input<'navigation' | 'action'>('navigation');
    public title = input<string>('Unsaved changes!');
    public description = input<string>('Do you want to save or discard your changes?');
    public saveLabel = input<string>('Save');
    public resetLabel = input<string>('Reset');
    public dialogTitle = input<string>('Unsaved Changes');
    public dialogDescription = input<string>('You have unsaved changes. Are you sure you want to leave?');
    public dialogConfirmText = input<string>('Leave');
    public dialogCancelText = input<string>('Stay');

    // Outputs
    public save = output<void>();
    public reset = output<void>();

    // Internal State
    public isJiggling = signal<boolean>(false);

    public onSave(): void {
        this.save.emit();
    }

    public onReset(): void {
        this.reset.emit();
    }

    /**
     * Called by the Guard to check if navigation is allowed.
     * Returns true if navigation is allowed, false otherwise.
     */
    public async canDeactivate(): Promise<boolean> {
        if (!this.hasUnsavedChanges()) {
            return true;
        }

        if (this.mode() === 'banner') {
            // Trigger jiggle animation
            this.isJiggling.set(true);
            setTimeout(() => this.isJiggling.set(false), 400); // Reset after animation
            return false; // Block navigation
        }

        if (this.mode() === 'dialog') {
            if (this.dialogMode() === 'action') {
                // Action mode: Show Save/Reset buttons and handle the action
                const dialogRef = this.confirmationDialogService.confirm({
                    title: this.dialogTitle(),
                    description: this.dialogDescription(),
                    confirmText: this.saveLabel(),
                    cancelText: this.resetLabel(),
                    variant: 'default',
                });

                const result = await lastValueFrom(dialogRef.closed);

                if (result === true) {
                    // User chose to save
                    this.save.emit();
                    return true; // Allow navigation after save
                } else if (result === false) {
                    // User chose to reset
                    this.reset.emit();
                    return true; // Allow navigation after reset
                }

                return false; // Dialog was closed without action
            } else {
                // Navigation mode: Show Stay/Leave buttons
                const dialogRef = this.confirmationDialogService.confirm({
                    title: this.dialogTitle(),
                    description: this.dialogDescription(),
                    confirmText: this.dialogConfirmText(),
                    cancelText: this.dialogCancelText(),
                    variant: 'destructive',
                });

                return await lastValueFrom(dialogRef.closed).then((result) => !!result);
            }
        }

        return true;
    }
}

import { lastValueFrom } from 'rxjs';

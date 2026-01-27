import { Dialog, DialogConfig, DialogRef } from '@angular/cdk/dialog';
import { Overlay } from '@angular/cdk/overlay';
import { ComponentType } from '@angular/cdk/portal';
import { inject, Injectable } from '@angular/core';
import {
  CONFIRMATION_DIALOG_DATA,
  MmcConfirmationDialogRef,
} from './confirmation-dialog-ref';
import { MmcConfirmationDialog } from './confirmation-dialog.component';

interface ConfirmationDialogOptions<T = unknown> extends Pick<
  DialogConfig,
  'ariaDescribedBy' | 'ariaLabel' | 'ariaLabelledBy' | 'autoFocus' | 'injector'
> {
  data?: T;
  title?: string;
  description?: string;
  showHeader?: boolean;
  showFooter?: boolean;
  confirmText?: string;
  cancelText?: string;
  variant?: 'default' | 'destructive';
  width?: string;
  height?: string;
  // Confirmation input options
  requireConfirmation?: boolean;
  confirmationValue?: string;
  confirmationPlaceholder?: string;
  confirmationLabel?: string;
}

@Injectable({
  providedIn: 'root',
})
export class MmcConfirmationDialogService {
  private readonly overlay = inject(Overlay);
  private readonly dialog = inject(Dialog);

  open<T>(
    component: ComponentType<T>,
    options?: ConfirmationDialogOptions,
  ): MmcConfirmationDialogRef<T> {
    const config: DialogConfig<
      unknown,
      DialogRef<unknown, MmcConfirmationDialog>
    > = {
      ...options,
      providers: [
        { provide: CONFIRMATION_DIALOG_DATA, useValue: options?.data },
      ],
      hasBackdrop: true, // Enable CDK backdrop
      panelClass: 'mmc-confirmation-dialog-panel',
    };

    const dialogRef = this.dialog.open<unknown, MmcConfirmationDialog>(
      MmcConfirmationDialog,
      config as any,
    );
    const mmcConfirmationDialogRef = new MmcConfirmationDialogRef<T>(
      dialogRef as any,
    );

    // Configure the dialog component
    const dialogInstance = dialogRef.componentInstance as MmcConfirmationDialog;
    if (dialogInstance) {
      if (component) {
        dialogInstance.setComponent(component);
      }
      if (options?.title) {
        dialogInstance.setTitle(options.title);
      }
      if (options?.description) {
        dialogInstance.setDescription(options.description);
      }
      if (options?.showHeader !== undefined) {
        dialogInstance.setShowHeader(options.showHeader);
      }
      if (options?.showFooter !== undefined) {
        dialogInstance.setShowFooter(options.showFooter);
      }
      if (options?.confirmText) {
        dialogInstance.setConfirmText(options.confirmText);
      }
      if (options?.cancelText) {
        dialogInstance.setCancelText(options.cancelText);
      }
      if (options?.variant) {
        dialogInstance.setVariant(options.variant);
      }
      if (options?.requireConfirmation !== undefined) {
        dialogInstance.setRequireConfirmation(options.requireConfirmation);
      }
      if (options?.confirmationValue) {
        dialogInstance.setConfirmationValue(options.confirmationValue);
      }
      if (options?.confirmationPlaceholder) {
        dialogInstance.setConfirmationPlaceholder(
          options.confirmationPlaceholder,
        );
      }
      if (options?.confirmationLabel) {
        dialogInstance.setConfirmationLabel(options.confirmationLabel);
      }
    }

    return mmcConfirmationDialogRef;
  }

  confirm(
    options: {
      title?: string;
      description?: string;
      confirmText?: string;
      cancelText?: string;
      variant?: 'default' | 'destructive';
      requireConfirmation?: boolean;
      confirmationValue?: string;
      confirmationPlaceholder?: string;
      confirmationLabel?: string;
    } = {},
  ): MmcConfirmationDialogRef<void, boolean> {
    const dialogOptions: ConfirmationDialogOptions = {
      ...options,
      showHeader: true,
      showFooter: true,
      title: options.title || 'Confirm Action',
      description: options.description || 'Are you sure you want to proceed?',
      confirmText: options.confirmText || 'Confirm',
      cancelText: options.cancelText || 'Cancel',
      variant: options.variant || 'default',
    };

    return this.open(null as any, dialogOptions);
  }
}

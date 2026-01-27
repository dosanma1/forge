import { CommonModule } from '@angular/common';
import { Component, signal, ViewChild } from '@angular/core';
import { Meta, StoryObj } from '@storybook/angular';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcUnsavedChanges } from './unsaved-changes.component';

// Mock Component to demonstrate usage
@Component({
  selector: 'mmc-unsaved-changes-demo',
  imports: [MmcUnsavedChanges, MmcButton, CommonModule],
  template: `
    <div class="p-8 space-y-6 border border-dashed border-gray-300 rounded-lg bg-gray-50">
      <div class="space-y-2">
        <h2 class="text-xl font-bold text-gray-900">Unsaved Changes Demo</h2>
        <p class="text-sm text-gray-600">
          Interact with the controls below to test the component behavior.
        </p>
      </div>

      <div class="space-y-4">
        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-2 block">Mode</label>
          <div class="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              (click)="mode.set('dialog')"
              [class.bg-blue-600]="mode() === 'dialog'"
              [class.text-white]="mode() === 'dialog'"
              [class.bg-white]="mode() !== 'dialog'"
              [class.text-gray-700]="mode() !== 'dialog'"
              class="px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700"
            >
              Dialog
            </button>
            <button
              type="button"
              (click)="mode.set('banner')"
              [class.bg-blue-600]="mode() === 'banner'"
              [class.text-white]="mode() === 'banner'"
              [class.bg-white]="mode() !== 'banner'"
              [class.text-gray-700]="mode() !== 'banner'"
              class="px-4 py-2 text-sm font-medium border border-gray-200 rounded-r-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700"
            >
              Banner
            </button>
          </div>
        </div>

        @if (mode() === 'dialog') {
        <div>
          <label class="text-xs font-semibold text-gray-500 uppercase mb-2 block">Dialog Mode</label>
          <div class="inline-flex rounded-md shadow-sm" role="group">
            <button
              type="button"
              (click)="dialogMode.set('navigation')"
              [class.bg-blue-600]="dialogMode() === 'navigation'"
              [class.text-white]="dialogMode() === 'navigation'"
              [class.bg-white]="dialogMode() !== 'navigation'"
              [class.text-gray-700]="dialogMode() !== 'navigation'"
              class="px-4 py-2 text-sm font-medium border border-gray-200 rounded-l-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700"
            >
              Navigation (Stay/Leave)
            </button>
            <button
              type="button"
              (click)="dialogMode.set('action')"
              [class.bg-blue-600]="dialogMode() === 'action'"
              [class.text-white]="dialogMode() === 'action'"
              [class.bg-white]="dialogMode() !== 'action'"
              [class.text-gray-700]="dialogMode() !== 'action'"
              class="px-4 py-2 text-sm font-medium border border-gray-200 rounded-r-lg hover:bg-gray-100 focus:z-10 focus:ring-2 focus:ring-blue-700"
            >
              Action (Save/Reset)
            </button>
          </div>
        </div>
        }

        <div class="space-y-1">
          <label class="text-xs font-semibold text-gray-500 uppercase">Status</label>
          <div class="flex items-center gap-2">
            <span 
              class="w-2 h-2 rounded-full"
              [class.bg-green-500]="!hasChanges()"
              [class.bg-amber-500]="hasChanges()"
            ></span>
            {{ hasChanges() ? 'Unsaved Changes' : 'Saved' }}
          </div>
        </div>
      </div>
      
      <div class="flex flex-wrap gap-4">
        <button mmcButton (click)="toggleChanges()">
          {{ hasChanges() ? 'Mark as Saved' : 'Make Changes' }}
        </button>
        
        <button mmcButton variant="outline" (click)="tryNavigate()">
          Try to Navigate (Simulate)
        </button>
      </div>

      <div class="text-xs text-gray-500 space-y-1">
        <div>* Switch between "Dialog" and "Banner" modes above.</div>
        @if (mode() === 'dialog') {
        <div>* Dialog mode: Choose between "Navigation" (Stay/Leave) or "Action" (Save/Reset).</div>
        }
        <div>* Click "Make Changes" to see the banner appear (in Banner mode).</div>
        <div>* "Try to Navigate" triggers the guard logic.</div>
      </div>

      <mmc-unsaved-changes
        [hasUnsavedChanges]="hasChanges()"
        [mode]="mode()"
        [dialogMode]="dialogMode()"
        [title]="title()"
        [description]="description()"
        (save)="onSave()"
        (reset)="onReset()"
      ></mmc-unsaved-changes>
    </div>
  `,
})
export class UnsavedChangesDemo {
  @ViewChild(MmcUnsavedChanges) unsavedChangesComponent!: MmcUnsavedChanges;

  hasChanges = signal(false);
  mode = signal<'dialog' | 'banner'>('dialog');
  dialogMode = signal<'navigation' | 'action'>('navigation');
  title = signal('Unsaved changes!');
  description = signal('Do you want to save or discard your changes?');

  toggleChanges() {
    this.hasChanges.update((v) => !v);
  }

  onSave() {
    console.log('Saved!');
    this.hasChanges.set(false);
    alert('Saved! Changes cleared.');
  }

  onReset() {
    console.log('Reset!');
    this.hasChanges.set(false);
    alert('Reset! Changes cleared.');
  }

  async tryNavigate() {
    if (this.unsavedChangesComponent) {
      const canLeave = await this.unsavedChangesComponent.canDeactivate();
      console.log('Can deactivate?', canLeave);
      if (canLeave) {
        alert('Navigation Allowed!');
      } else {
        console.log('Navigation Blocked (Banner jiggling or Dialog cancelled)');
      }
    }
  }
}

const meta: Meta<UnsavedChangesDemo> = {
  title: 'Organisms/Unsaved Changes',
  component: UnsavedChangesDemo,
  tags: ['autodocs'],
  decorators: [
    (story) => ({
      template: `<div style="min-height: 400px; position: relative;">${story().template}</div>`,
    }),
  ],
};

export default meta;
type Story = StoryObj<UnsavedChangesDemo>;

export const InteractiveDemo: Story = {};

export const BannerVariant: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Interactive demo with controls to toggle changes and test navigation blocking.',
      }
    }
  }
};

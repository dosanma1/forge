import { signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcLabel } from '../label/label.directive';
import { MmcCheckbox } from './checkbox.component';

const meta: Meta<MmcCheckbox> = {
    title: 'Atoms/Checkbox',
    component: MmcCheckbox,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [MmcLabel, MmcCheckbox, FormsModule],
        }),
    ],
};

export default meta;
type Story = StoryObj<MmcCheckbox>;

export const Default: Story = {
    render: () => ({
        props: {
            checked: signal(false),
        },
        template: `
            <label for="checkbox-default" class="flex items-center gap-2 cursor-pointer" mmcLabel>
                <mmc-checkbox id="checkbox-default" [(checked)]="checked"></mmc-checkbox>
                Click me ({{checked() ? 'Checked' : 'Unchecked'}})
            </label>
        `,
    }),
};

export const Checked: Story = {
    render: () => ({
        props: {
            checked: signal(true),
        },
        template: `
            <label for="checkbox-checked" class="flex items-center gap-2 cursor-pointer" mmcLabel>
                <mmc-checkbox id="checkbox-checked" [(checked)]="checked"></mmc-checkbox>
                Checked by default ({{checked() ? 'Checked' : 'Unchecked'}})
            </label>
        `,
    }),
};

export const Unchecked: Story = {
    render: () => ({
        props: {
            checked: signal(false),
        },
        template: `
            <label class="flex items-center gap-2 cursor-pointer" mmcLabel>
                <mmc-checkbox [(checked)]="checked"></mmc-checkbox>
                Unchecked by default ({{checked() ? 'Checked' : 'Unchecked'}})
            </label>
        `,
    }),
};

export const Indeterminate: Story = {
    render: () => ({
        props: {
            indeterminate: signal(true),
        },
        template: `
            <label class="flex items-center gap-2 cursor-pointer" mmcLabel>
                <mmc-checkbox [(indeterminate)]="indeterminate"></mmc-checkbox>
                Indeterminate state (Click to toggle)
            </label>
        `,
    }),
};

export const Disabled: Story = {
    render: () => ({
        props: {
            checked: signal(false),
        },
        template: `
            <label class="flex items-center gap-2 opacity-50 cursor-not-allowed" mmcLabel>
                <mmc-checkbox [disabled]="true" [(checked)]="checked"></mmc-checkbox>
                Disabled (cannot be clicked)
            </label>
        `,
    }),
};

export const DisabledChecked: Story = {
    render: () => ({
        props: {
            checked: signal(true),
        },
        template: `
            <label class="flex items-center gap-2 opacity-50 cursor-not-allowed" mmcLabel>
                <mmc-checkbox [checked]="true" [disabled]="true"></mmc-checkbox>
                Disabled & Checked
            </label>
        `,
    }),
};

export const WithLabel: Story = {
    name: 'With Label and Description',
    render: () => ({
        props: {
            accepted: signal(false),
        },
        template: `
            <div class="flex items-start gap-2">
                <mmc-checkbox [(checked)]="accepted" class="mt-1"></mmc-checkbox>
                <div class="grid gap-1.5 leading-none cursor-pointer" (click)="accepted.set(!accepted())">
                    <label mmcLabel class="text-sm font-medium leading-none cursor-pointer">
                        Accept terms and conditions
                    </label>
                    <p class="text-sm text-muted-foreground">
                        You agree to our Terms of Service and Privacy Policy.
                    </p>
                </div>
            </div>
        `,
    }),
};

export const MultipleCheckboxes: Story = {
    name: 'Multiple Checkboxes',
    render: () => ({
        props: {
            options: signal([
                { id: 1, label: 'Option 1', checked: false },
                { id: 2, label: 'Option 2', checked: true },
                { id: 3, label: 'Option 3', checked: false },
                { id: 4, label: 'Option 4', checked: true },
            ]),
            toggle: function (index: number) {
                this.options.update(opts => {
                    opts[index].checked = !opts[index].checked;
                    return [...opts];
                });
            },
        },
        template: `
            <div class="space-y-3">
				@for (option of options(); track option.id) {
					<label class="flex items-center gap-2 cursor-pointer" mmcLabel>
						<mmc-checkbox 
							[checked]="option.checked"
							(checkedChange)="toggle($index)"
						></mmc-checkbox>
						{{ option.label }}
					</label>
				}
            </div>
        `,
    }),
};


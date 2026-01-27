import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { MmcInputChip } from './input-chip.component';

const meta: Meta<MmcInputChip> = {
    title: 'Molecules/Input/Chip Input',
    component: MmcInputChip,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [MmcInputChip],
            providers: [provideIcons({ lucideX })],
        }),
    ],
    argTypes: {
        placeholder: { control: 'text' },
        removable: { control: 'boolean' },
        removableAll: { control: 'boolean' },
        required: { control: 'boolean' },
        autocomplete: { control: 'text' },
    },
};

export default meta;
type Story = StoryObj<MmcInputChip>;

export const Default: Story = {
    args: {
        placeholder: 'Type and press Enter...',
        removable: true,
        removableAll: false,
    },
    render: (args) => ({
        props: args,
        template: `
			<div class="w-96">
				<label class="block text-sm font-medium mb-2">Tags</label>
				<mmc-input-chip
					[placeholder]="placeholder"
					[removable]="removable"
					[removableAll]="removableAll"
				></mmc-input-chip>
				<p class="text-sm text-muted-foreground mt-2">Type a value and press Enter or comma to add it</p>
			</div>
		`,
    }),
};

export const WithRemoveAll: Story = {
    args: {
        placeholder: 'Add emails...',
        removable: true,
        removableAll: true,
    },
    render: (args) => ({
        props: args,
        template: `
			<div class="w-96">
				<label class="block text-sm font-medium mb-2">Email Addresses</label>
				<mmc-input-chip
					[placeholder]="placeholder"
					[removable]="removable"
					[removableAll]="removableAll"
				></mmc-input-chip>
			</div>
		`,
    }),
};

export const Required: Story = {
    args: {
        placeholder: 'Required field...',
        removable: true,
        removableAll: false,
        required: true,
    },
    render: (args) => ({
        props: args,
        template: `
			<div class="w-96">
				<label class="block text-sm font-medium mb-2">Tags <span class="text-red-500">*</span></label>
				<mmc-input-chip
					[placeholder]="placeholder"
					[removable]="removable"
					[removableAll]="removableAll"
					[required]="required"
				></mmc-input-chip>
			</div>
		`,
    }),
};

export const NonRemovable: Story = {
    args: {
        placeholder: 'Fixed tags...',
        removable: false,
        removableAll: false,
    },
    render: (args) => ({
        props: args,
        template: `
			<div class="w-96">
				<label class="block text-sm font-medium mb-2">Read-only Tags</label>
				<mmc-input-chip
					[placeholder]="placeholder"
					[removable]="removable"
					[removableAll]="removableAll"
				></mmc-input-chip>
				<p class="text-sm text-muted-foreground mt-2">Tags cannot be removed in this mode</p>
			</div>
		`,
    }),
};

import { provideIcons } from '@ng-icons/core';
import { lucideCircleX, lucideSearch } from '@ng-icons/lucide';
import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { MmcInputSearch } from './input-search.component';

const meta: Meta<MmcInputSearch> = {
    title: 'Molecules/Input/Search Input',
    component: MmcInputSearch,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [MmcInputSearch],
            providers: [provideIcons({ lucideSearch, lucideCircleX })],
        }),
    ],
    argTypes: {
        placeholder: { control: 'text' },
        debounceTime: { control: 'number' },
    },
};

export default meta;
type Story = StoryObj<MmcInputSearch>;

export const Default: Story = {
    args: {
        placeholder: 'Search...',
        debounceTime: 0,
    },
    render: (args) => ({
        props: args,
        template: `
			<div class="w-96">
				<label class="block text-sm font-medium mb-2">Search</label>
				<mmc-input-search
					[placeholder]="placeholder"
					[debounceTime]="debounceTime"
				></mmc-input-search>
			</div>
		`,
    }),
};

export const WithDebounce: Story = {
    args: {
        placeholder: 'Search with debounce...',
        debounceTime: 500,
    },
    render: (args) => ({
        props: args,
        template: `
			<div class="w-96">
				<label class="block text-sm font-medium mb-2">Debounced Search (500ms)</label>
				<mmc-input-search
					[placeholder]="placeholder"
					[debounceTime]="debounceTime"
				></mmc-input-search>
				<p class="text-sm text-muted-foreground mt-2">Search queries are debounced by 500ms</p>
			</div>
		`,
    }),
};

export const CustomerSearch: Story = {
    args: {
        placeholder: 'Search customers...',
        debounceTime: 300,
    },
    render: (args) => ({
        props: args,
        template: `
			<div class="w-full max-w-md">
				<mmc-input-search
					[placeholder]="placeholder"
					[debounceTime]="debounceTime"
				></mmc-input-search>
			</div>
		`,
    }),
};

export const ProductSearch: Story = {
    args: {
        placeholder: 'Find products...',
        debounceTime: 300,
    },
    render: (args) => ({
        props: args,
        template: `
			<div class="w-full">
				<mmc-input-search
					[placeholder]="placeholder"
					[debounceTime]="debounceTime"
					inputClass="text-lg"
				></mmc-input-search>
			</div>
		`,
    }),
};

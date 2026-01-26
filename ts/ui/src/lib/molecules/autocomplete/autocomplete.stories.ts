import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideLoaderCircle, lucideSearch, lucideX } from '@ng-icons/lucide';
import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { AutocompleteComponent } from './autocomplete.component';

const meta: Meta<AutocompleteComponent> = {
    title: 'Molecules/Autocomplete',
    component: AutocompleteComponent,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [AutocompleteComponent, ReactiveFormsModule],
            providers: [
                provideIcons({
                    lucideSearch,
                    lucideLoaderCircle,
                    lucideX
                }),
            ],
        }),
    ],
    argTypes: {
        placeholder: { control: 'text' },
        disabled: { control: 'boolean' },
        loading: { control: 'boolean' },
        width: { control: 'text' },
    },
};

export default meta;
type Story = StoryObj<AutocompleteComponent>;

const options = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'date', label: 'Date' },
    { value: 'elderberry', label: 'Elderberry' },
];

export const Default: Story = {
    args: {
        options: options,
        placeholder: 'Select a fruit...',
        width: 'w-72',
    },
    render: (args) => ({
        props: {
            ...args,
            control: new FormControl(),
            onSearch: (term: string) => {
                console.log('Search:', term);
            }
        },
        template: `
            <div class="h-64">
                <mmc-autocomplete
                    [formControl]="control"
                    [options]="options"
                    [placeholder]="placeholder"
                    [width]="width"
                    [disabled]="disabled"
                    [loading]="loading"
                    (searchChange)="onSearch($event)"
                ></mmc-autocomplete>
                <div class="mt-4">
                    Selected value: {{ control.value }}
                </div>
            </div>
        `,
    }),
};

export const Loading: Story = {
    args: {
        options: [],
        placeholder: 'Searching...',
        loading: true,
        width: 'w-72',
    },
    render: (args) => ({
        props: {
            ...args,
            control: new FormControl(),
        },
        template: `
            <div class="h-64">
                <mmc-autocomplete
                    [formControl]="control"
                    [options]="options"
                    [placeholder]="placeholder"
                    [width]="width"
                    [loading]="loading"
                ></mmc-autocomplete>
            </div>
        `,
    }),
};

export const Disabled: Story = {
    args: {
        options: options,
        placeholder: 'Disabled input',
        disabled: true,
        width: 'w-72',
    },
    render: (args) => ({
        props: {
            ...args,
            control: new FormControl({ value: 'apple', disabled: true }),
        },
        template: `
            <div class="h-64">
                <mmc-autocomplete
                    [formControl]="control"
                    [options]="options"
                    [placeholder]="placeholder"
                    [width]="width"
                    [disabled]="disabled"
                ></mmc-autocomplete>
            </div>
        `,
    }),
};

import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Meta, StoryObj } from '@storybook/angular';
import {
	SelectOption,
	SelectWithSearchComponent,
} from './select-with-search.component';

const meta: Meta<SelectWithSearchComponent> = {
	title: 'Molecules/Select With Search',
	component: SelectWithSearchComponent,
	tags: ['autodocs'],
	parameters: {
		layout: 'centered',
	},
	argTypes: {
		variant: {
			control: { type: 'select' },
			options: [
				'default',
				'destructive',
				'outline',
				'secondary',
				'ghost',
				'link',
			],
		},
		positionY: {
			control: { type: 'select' },
			options: ['top', 'bottom'],
		},
		loading: {
			control: { type: 'boolean' },
		},
		clearable: {
			control: { type: 'boolean' },
		},
		withIcon: {
			control: { type: 'boolean' },
		},
	},
};

export default meta;
type Story = StoryObj<SelectWithSearchComponent>;

const mockOptions: SelectOption[] = [
	{ value: 'btc-usdt', label: 'BTC/USDT - Bitcoin to Tether' },
	{ value: 'eth-usdt', label: 'ETH/USDT - Ethereum to Tether' },
	{ value: 'ada-usdt', label: 'ADA/USDT - Cardano to Tether' },
	{ value: 'sol-usdt', label: 'SOL/USDT - Solana to Tether' },
	{ value: 'dot-usdt', label: 'DOT/USDT - Polkadot to Tether' },
	{ value: 'link-usdt', label: 'LINK/USDT - Chainlink to Tether' },
	{ value: 'uni-usdt', label: 'UNI/USDT - Uniswap to Tether' },
	{ value: 'matic-usdt', label: 'MATIC/USDT - Polygon to Tether' },
	{ value: 'avax-usdt', label: 'AVAX/USDT - Avalanche to Tether' },
	{ value: 'atom-usdt', label: 'ATOM/USDT - Cosmos to Tether' },
	{ value: 'disabled-option', label: 'Disabled Option', disabled: true },
];

export const Default: Story = {
	args: {
		placeholder: 'Select a trading pair...',
		searchPlaceholder: 'Search trading pairs...',
		options: mockOptions,
		clearable: true,
		withIcon: true,
		loading: false,
		variant: 'outline',
		positionY: 'bottom',
	},
};

export const WithFormControl: Story = {
	render: (args) => {
		const formGroup = new FormGroup({
			tradingPair: new FormControl('eth-usdt'),
		});

		return {
			props: {
				...args,
				formGroup,
			},
			template: `
				<div [formGroup]="formGroup">
					<mmc-select-with-search
						formControlName="tradingPair"
						[placeholder]="placeholder"
						[searchPlaceholder]="searchPlaceholder"
						[options]="options"
						[clearable]="clearable"
						[withIcon]="withIcon"
						[loading]="loading"
						[variant]="variant"
						[positionY]="positionY"
					/>
				</div>
				<div class="mt-4 p-2 bg-muted rounded text-sm">
					<strong>Selected value:</strong> {{ formGroup.get('tradingPair')?.value || 'None' }}
				</div>
			`,
			imports: [ReactiveFormsModule, SelectWithSearchComponent],
			moduleMetadata: {
				imports: [ReactiveFormsModule],
			},
		};
	},
	args: {
		...Default.args,
	},
};

export const Loading: Story = {
	args: {
		...Default.args,
		loading: true,
	},
};

export const NoIcon: Story = {
	args: {
		...Default.args,
		withIcon: false,
	},
};

export const NotClearable: Story = {
	args: {
		...Default.args,
		clearable: false,
	},
};

export const EmptyOptions: Story = {
	args: {
		...Default.args,
		options: [],
	},
};

export const TopPosition: Story = {
	args: {
		...Default.args,
		positionY: 'top',
	},
	parameters: {
		layout: 'padded',
	},
};

export const WithSearchEvents: Story = {
	render: (args) => {
		let lastSearchTerm = '';

		return {
			props: {
				...args,
				lastSearchTerm,
				onSearchChange: (term: string) => {
					lastSearchTerm = term;
				},
			},
			template: `
				<mmc-select-with-search
					[placeholder]="placeholder"
					[searchPlaceholder]="searchPlaceholder"
					[options]="options"
					[clearable]="clearable"
					[withIcon]="withIcon"
					[loading]="loading"
					[variant]="variant"
					[positionY]="positionY"
					(searchChange)="onSearchChange($event)"
				/>
				<div class="mt-4 p-2 bg-muted rounded text-sm">
					<strong>Search events are logged to console</strong>
				</div>
			`,
			imports: [SelectWithSearchComponent],
		};
	},
	args: {
		...Default.args,
	},
};

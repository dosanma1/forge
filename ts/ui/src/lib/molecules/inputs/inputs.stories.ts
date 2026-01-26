import { provideIcons } from '@ng-icons/core';
import { lucideCircleHelp, lucideMail } from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcInput } from '../../atoms/input/input.directive';
import { MmcLabel } from '../../atoms/label/label.directive';
import { MmcInputChip } from './input-chip/input-chip.component';
import { MmcInputSearch } from './input-search/input-search.component';

const emailPlaceholder = 'you@example.com';

const meta: Meta<MmcInput> = {
	title: 'Molecules/Inputs',
	component: MmcInput,
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [MmcLabel, MmcInput, MmcInputSearch, MmcInputChip],
			providers: [provideIcons({ lucideMail, lucideCircleHelp })],
		}),
	],
};

export default meta;
type Story = StoryObj<MmcInput>;

export const Default: Story = {
	name: 'Input with label',
	render: ({ ...args }) => ({
		props: args,
		template: `
			<div>
				<label mmcLabel for="email">Email</label>
				<input mmcInput id="email" type="email" placeholder="${emailPlaceholder}"/>
			</div>
			`,
	}),
};

export const SearchInput: Story = {
	name: 'Input search',
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-input-search placeholder="Search customers"></mmc-input-search>
		`,
	}),
};

export const ChipInput: Story = {
	name: 'Input chip',
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-input-chip
				placeholder="${emailPlaceholder}"
				[removable]="true"
				[removableAll]="true"
			></mmc-input-chip>
		`,
	}),
};

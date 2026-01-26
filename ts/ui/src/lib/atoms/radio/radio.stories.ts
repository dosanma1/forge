import { FormsModule } from '@angular/forms';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcLabel } from '../label/label.directive';
import { MmcRadioGroup } from './radio-group.component';
import { MmcRadioItem } from './radio-item.component';

const meta: Meta<MmcRadioGroup> = {
	title: 'Atoms/Radio',
	component: MmcRadioGroup,
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [MmcRadioGroup, MmcRadioItem, MmcLabel, FormsModule],
		}),
	],
	render: ({ ...args }) => ({
		props: args,
		template: `
		<mmc-radio-group orientation="vertical">
			<mmc-radio-item value="1">One</mmc-radio-item>
			<mmc-radio-item value="2">Two</mmc-radio-item>
			<mmc-radio-item value="3">Three</mmc-radio-item>
		</mmc-radio-group>
        `,
	}),
};

export default meta;
type Story = StoryObj<MmcRadioGroup>;

export const Default: Story = {};

export const Horizontal: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
		<mmc-radio-group orientation="horizontal">
			<mmc-radio-item value="1">One</mmc-radio-item>
			<mmc-radio-item value="2">Two</mmc-radio-item>
			<mmc-radio-item value="3">Three</mmc-radio-item>
		</mmc-radio-group>
        `,
	}),
};

export const PreSelected: Story = {
	name: 'With Pre-selected Value',
	render: ({ ...args }) => ({
		props: args,
		template: `
		<mmc-radio-group orientation="vertical" [value]="'2'">
			<mmc-radio-item value="1">One</mmc-radio-item>
			<mmc-radio-item value="2">Two (Selected)</mmc-radio-item>
			<mmc-radio-item value="3">Three</mmc-radio-item>
		</mmc-radio-group>
        `,
	}),
};

export const WithDisabled: Story = {
	name: 'With Disabled Item',
	render: ({ ...args }) => ({
		props: args,
		template: `
		<mmc-radio-group orientation="vertical">
			<mmc-radio-item value="1">One</mmc-radio-item>
			<mmc-radio-item value="2" [disabled]="true">Two (Disabled)</mmc-radio-item>
			<mmc-radio-item value="3">Three</mmc-radio-item>
		</mmc-radio-group>
        `,
	}),
};


// <mmc-radio-group orientation="vertical">
// <label class="flex items-center gap-2" mmcLabel>
// 	<mmc-radio-item value="1" />
// 	Option 1
// </label>
// <label class="flex items-center gap-2" mmcLabel>
// 	<mmc-radio-item value="2" />
// 	Option 2
// </label>
// <label class="flex items-center gap-2" mmcLabel>
// 	<mmc-radio-item value="3" />
// 	Option 3
// </label>
// </mmc-radio-group>

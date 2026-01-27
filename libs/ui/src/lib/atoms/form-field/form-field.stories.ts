import { signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcCheckbox } from '../checkbox/checkbox.component';
import { MmcInput } from '../input/input.directive';
import { MmcLabel } from '../label/label.directive';
import { MmcFormField } from './form-field.component';

const meta: Meta<MmcFormField> = {
	title: 'Atoms/Form Field',
	component: MmcFormField,
	tags: ['autodocs'],
	args: {
		additionalClasses: '',
	},
	decorators: [
		moduleMetadata({
			imports: [MmcLabel, MmcInput, MmcCheckbox, FormsModule],
		}),
	],
};

export default meta;
type Story = StoryObj<MmcFormField>;

export const Default: Story = {
	render: ({ ...args }) => ({
		props: {
			...args,
			checked: signal(false),
		},
		template: `
			<mmc-form-field>
				<label mmcLabel>Username</label>
				<input mmcInput type="text" placeholder="Enter your username" />
			</mmc-form-field>

			<br/>

			<label class="flex flex-row items-center gap-2 cursor-pointer">
				<mmc-checkbox [(ngModel)]="checked"></mmc-checkbox>
				<span mmcLabel class="cursor-pointer">Click me ({{checked() ? 'Checked' : 'Unchecked'}})</span>
			</label>
		`,
	}),
};

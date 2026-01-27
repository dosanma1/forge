import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcListboxOption } from './listbox-option.component';
import { MmcListbox } from './listbox.component';

const meta: Meta<MmcListbox> = {
	title: 'Molecules/Listbox',
	component: MmcListbox,
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [MmcListbox, MmcListboxOption],
		}),
	],
};

export default meta;
type Story = StoryObj<MmcListbox>;

export const Default: Story = {
	name: 'Single-Select Listbox',
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-listbox class="w-[250px]">
				<ng-template mmcListboxLabel let-options>
					<div class="flex-1 truncate text-left">
						<mmc-icon size="sm" [name]="options[0].value()"> </mmc-icon>
						{{ options[0].content }}
					</div>
				</ng-template>
				<mmc-listbox-option value="One">One</mmc-listbox-option>
				<mmc-listbox-option value="Two">Two</mmc-listbox-option>
				<mmc-listbox-option value="Three">Three</mmc-listbox-option>
				<mmc-listbox-option value="Four">Four</mmc-listbox-option>
				<mmc-listbox-option value="Five">Five</mmc-listbox-option>
				<mmc-listbox-option value="Six">Six</mmc-listbox-option>
				<mmc-listbox-option value="Seven">Seven</mmc-listbox-option>
				<mmc-listbox-option value="Eight">Eight</mmc-listbox-option>
				<mmc-listbox-option value="Nine">Nine</mmc-listbox-option>
				<mmc-listbox-option value="Ten">Ten</mmc-listbox-option>
			</mmc-listbox>
		`,
	}),
};

export const Multiple: Story = {
	name: 'Multiple-Select Listbox',
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-listbox mode="multiple" class="w-[250px]">
				<mmc-listbox-option value="One">One</mmc-listbox-option>
				<mmc-listbox-option value="Two">Two</mmc-listbox-option>
				<mmc-listbox-option value="Three">Three</mmc-listbox-option>
				<mmc-listbox-option value="Four">Four</mmc-listbox-option>
				<mmc-listbox-option value="Five">Five</mmc-listbox-option>
				<mmc-listbox-option value="Six">Six</mmc-listbox-option>
				<mmc-listbox-option value="Seven">Seven</mmc-listbox-option>
				<mmc-listbox-option value="Eight">Eight</mmc-listbox-option>
				<mmc-listbox-option value="Nine">Nine</mmc-listbox-option>
				<mmc-listbox-option value="Ten">Ten</mmc-listbox-option>
			</mmc-listbox>
		`,
	}),
};

// export const Sections: Story = {
// 	name: 'Listbox with Sections' ,
// 	render: ({ ...args }) => ({
// 		props: args,
// 		template: `
// 			<mmc-listbox mode="multiple">
// 				<mmc-listbox-option value="One">One</mmc-listbox-option>
// 				<mmc-listbox-option value="Two">Two</mmc-listbox-option>
// 				<mmc-listbox-option value="Three">Three</mmc-listbox-option>
// 			</mmc-listbox>
// 		`,
// 	}),
// };

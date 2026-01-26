import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcLabel } from '../label/label.directive';
import { MmcSwitch } from './switch.component';

const meta: Meta<MmcSwitch> = {
	title: 'Atoms/Switch',
	component: MmcSwitch,
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [MmcLabel, MmcSwitch],
		}),
	],
	render: ({ ...args }) => ({
		props: args,
		template: `
            <label class="flex items-center gap-2" mmcLabel>
                <mmc-switch></mmc-switch>
                Click me
            </label>
        `,
	}),
};

export default meta;
type Story = StoryObj<MmcSwitch>;

export const Default: Story = {};

export const Checked: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
            <label class="flex items-center gap-2" mmcLabel>
                <mmc-switch [checked]="true"></mmc-switch>
                Checked
            </label>
        `,
	}),
};

export const Disabled: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
            <label class="flex items-center gap-2" mmcLabel>
                <mmc-switch [disabled]="true"></mmc-switch>
                Disabled
            </label>
        `,
	}),
};

export const DisabledChecked: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
            <label class="flex items-center gap-2" mmcLabel>
                <mmc-switch [checked]="true" [disabled]="true"></mmc-switch>
                Disabled & Checked
            </label>
        `,
	}),
};

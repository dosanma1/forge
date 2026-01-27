import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcLabel } from './label.directive';

const meta: Meta<MmcLabel> = {
	title: 'Atoms/Label',
	component: MmcLabel,
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [MmcLabel],
		}),
	],
};

export default meta;
type Story = StoryObj<MmcLabel>;

export const Default: Story = {
	name: 'Input with label',
	render: ({ ...args }) => ({
		props: args,
		template: `<label mmcLabel>Label</label>`,
	}),
};

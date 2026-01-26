import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcDivider } from './divider.component';

const meta: Meta<MmcDivider> = {
	title: 'Atoms/Divider',
	component: MmcDivider,
	tags: ['autodocs'],
	parameters: {
		layout: 'padded',
	},
	decorators: [
		moduleMetadata({
			imports: [MmcDivider],
		}),
	],
	render: ({ ...args }) => ({
		props: args,
		template: `
		<b>Horizontal divider</b>
			<ul>
				<li>
					<p class="my-3">
						Lorem Ipsum is simply dummy text of the printing and typesetting industry.
						Lorem Ipsum has been the industry's standard dummy text ever since the
						1500s, when an unknown printer took a galley of type and scrambled it to
						make a type specimen book
					</p>
					<mmc-divider />
				</li>
				<li>
					<p class="my-3">
						Lorem Ipsum is simply dummy text of the printing and typesetting industry.
						Lorem Ipsum has been the industry's standard dummy text ever since the
						1500s, when an unknown printer took a galley of type and scrambled it to
						make a type specimen book
					</p>
					<mmc-divider />
				</li>
				<li>
					<p class="my-3">
						Lorem Ipsum is simply dummy text of the printing and typesetting industry.
						Lorem Ipsum has been the industry's standard dummy text ever since the
						1500s, when an unknown printer took a galley of type and scrambled it to
						make a type specimen book
					</p>
				</li>
			</ul>
			<mmc-divider class="my-8" />
			<div>
			<b>Vertical divider</b>
			<ul class="grid grid-cols-3 gap-4">
				<li class="flex">
					<p class="my-3">
						Lorem Ipsum is simply dummy text of the printing and typesetting
						industry. Lorem Ipsum has been the industry's standard dummy text ever
						since the 1500s, when an unknown printer took a galley of type and
						scrambled it to make a type specimen book
					</p>
					<mmc-divider class="ml-4" orientation="vertical" />
				</li>
				<li class="flex">
					<p class="my-3">
						Lorem Ipsum is simply dummy text of the printing and typesetting
						industry. Lorem Ipsum has been the industry's standard dummy text ever
						since the 1500s, when an unknown printer took a galley of type and
						scrambled it to make a type specimen book
					</p>
					<mmc-divider class="ml-4" orientation="vertical" />
				</li>
				<li class="flex">
					<p class="my-3">
						Lorem Ipsum is simply dummy text of the printing and typesetting
						industry. Lorem Ipsum has been the industry's standard dummy text ever
						since the 1500s, when an unknown printer took a galley of type and
						scrambled it to make a type specimen book
					</p>
				</li>
			</ul>
		</div>
		`,
	}),
};

export default meta;
type Story = StoryObj<MmcDivider>;

export const Default: Story = {};

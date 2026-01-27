import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcLabel } from '../label/label.directive';
import { MmcChatBubble } from './chat-bubble.component';

type ChatBubbleComponentPropsAndCustomArgs = MmcChatBubble &
	Partial<{
		message: string;
	}>;

const meta: Meta<ChatBubbleComponentPropsAndCustomArgs> = {
	title: 'Atoms/Chat Bubble',
	component: MmcChatBubble,
	tags: ['autodocs'],
	args: {
		direction: 'outgoing',
		tail: true,
		time: new Date(),
		message: 'Hey! How are you?',
	},
	argTypes: {
		direction: {
			control: 'select',
			options: ['incoming', 'outgoing'],
		},
		time: {
			control: 'date',
		},
	},
	decorators: [
		moduleMetadata({
			imports: [MmcLabel, MmcChatBubble],
		}),
	],
	render: ({ ...args }) => ({
		props: args,
		template: `
            <mmc-chat-bubble direction="${args.direction}" [tail]="${args.tail}" time="${args.time}">
				<span class="min-w-4 text-base leading-5">${args.message}</span>
            </mmc-chat-bubble>
        `,
	}),
};

export default meta;
type Story = StoryObj<ChatBubbleComponentPropsAndCustomArgs>;

export const Default: Story = {};

export const Outgoing: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-chat-bubble direction="outgoing" [tail]="${args.tail}" time="${args.time}">
				<span class="min-w-4 text-base leading-5">${args.message}</span>
			</mmc-chat-bubble>
		`,
	}),
};

export const Incoming: Story = {
	render: ({ ...args }) => ({
		props: args,
		template: `
			<mmc-chat-bubble direction="incoming" [tail]="${args.tail}" time="${args.time}">
				<span class="min-w-4 text-base leading-5">${args.message}</span>
			</mmc-chat-bubble>
			`,
	}),
};

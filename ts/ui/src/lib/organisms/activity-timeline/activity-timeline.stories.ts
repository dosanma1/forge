import { Meta, StoryObj } from '@storybook/angular';
import { ActivityGroup, MmcActivityTimeline } from './activity-timeline.component';

const meta: Meta<MmcActivityTimeline> = {
    title: 'Organisms/Activity Timeline',
    component: MmcActivityTimeline,
    tags: ['autodocs'],
    parameters: {
        layout: 'centered',
    },
};

export default meta;
type Story = StoryObj<MmcActivityTimeline>;

const mockGroups: ActivityGroup[] = [
    {
        title: 'This week',
        items: [
            {
                id: '1',
                type: 'status_change',
                timestamp: '1 day ago',
                user: {
                    name: 'Daniel James',
                    avatarUrl: 'https://i.pravatar.cc/150?u=daniel',
                },
                meta: {
                    value: 'Deal Closed',
                },
            },
            {
                id: '2',
                type: 'email',
                timestamp: '2 days ago',
                title: 'Welcome to Attio',
                description:
                    "Hi Yvonne, I'm thrilled to be able to welcome you to Attio! The team will be able to get you onboarded this afternoon - what time works best for you? We'll cover getting your data in, setting up collections...",
                users: [
                    { name: 'Nico Greenberg', avatarUrl: 'https://i.pravatar.cc/150?u=nico' },
                    { name: 'Yvonne Thompson', avatarUrl: 'https://i.pravatar.cc/150?u=yvonne' },
                ],
            },
            {
                id: '3',
                type: 'expandable_group',
                timestamp: '',
                title: 'Show 3 more emails from this week',
                collapsedItems: [
                    {
                        id: '3-1',
                        type: 'email',
                        timestamp: '3 days ago',
                        title: 'Re: Onboarding',
                        description: 'Just checking in on the progress...',
                        users: [{ name: 'Daniel James' }]
                    },
                    {
                        id: '3-2',
                        type: 'email',
                        timestamp: '4 days ago',
                        title: 'Meeting notes',
                        description: 'Here are the notes from our call...',
                        users: [{ name: 'Yvonne Thompson' }]
                    },
                    {
                        id: '3-3',
                        type: 'email',
                        timestamp: '5 days ago',
                        title: 'Contract Review',
                        description: 'Please review the attached contract draft.',
                        users: [{ name: 'Legal Team' }]
                    }
                ]
            },
            {
                id: '4',
                type: 'attribute_change',
                timestamp: '2 days ago',
                user: {
                    name: 'Nico Greenberg',
                    avatarUrl: 'https://i.pravatar.cc/150?u=nico',
                },
                meta: {
                    count: 3,
                },
                attributeChanges: [
                    { attribute: 'Status', oldValue: 'In Progress', newValue: 'Completed' },
                    { attribute: 'Priority', oldValue: 'Medium', newValue: 'High' },
                    { attribute: 'Assignee', oldValue: 'John Doe', newValue: 'Jane Smith' }
                ]
            },
            {
                id: '5',
                type: 'add_to_list',
                timestamp: '3 days ago',
            },
            {
                id: '6',
                type: 'merge',
                timestamp: '6 days ago',
            },
            {
                id: '7',
                type: 'calendar_event',
                timestamp: '10:00 - 11:40 AM',
                title: 'Due Diligence Update',
                users: [
                    { name: 'NAM' },
                    { name: 'AM' },
                    { name: 'M' }
                ],
                meta: {
                    count: 4
                }
            },
            {
                id: '8',
                type: 'expandable_group',
                timestamp: '',
                title: 'Show 3 more events from this week',
                collapsedItems: [
                    {
                        id: '8-1',
                        type: 'calendar_event',
                        timestamp: '2:00 - 3:00 PM',
                        title: 'Product Demo',
                        users: [{ name: 'DJ' }]
                    },
                    {
                        id: '8-2',
                        type: 'calendar_event',
                        timestamp: '4:00 - 5:00 PM',
                        title: 'Team Sync',
                        users: [{ name: 'All' }]
                    },
                    {
                        id: '8-3',
                        type: 'calendar_event',
                        timestamp: '5:30 - 6:00 PM',
                        title: 'Wrap up',
                        users: [{ name: 'Nico' }]
                    }
                ]
            },
        ],
    },
];

export const Default: Story = {
    args: {
        groups: mockGroups,
    },
    render: (args) => ({
        props: args,
        template: `<div class="w-[600px] bg-background p-8 rounded-xl border border-border"><mmc-activity-timeline [groups]="groups"></mmc-activity-timeline></div>`
    })
};

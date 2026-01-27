import { provideIcons } from '@ng-icons/core';
import { lucideChevronDown, lucideChevronRight, lucideFile, lucideFolder, lucideFolderOpen } from '@ng-icons/lucide';
import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcTree, TreeNode } from './tree-view.component';

const meta: Meta<MmcTree> = {
    title: 'Molecules/Tree View',
    component: MmcTree,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [MmcTree],
            providers: [
                provideIcons({
                    lucideChevronRight,
                    lucideChevronDown,
                    lucideFolder,
                    lucideFile,
                    lucideFolderOpen
                }),
            ],
        }),
    ],
};

export default meta;
type Story = StoryObj<MmcTree>;

const treeData: TreeNode[] = [
    {
        name: 'Documents',
        expandable: true,
        level: 0,
        icon: 'lucideFolder',
        expandedIcon: 'lucideFolderOpen',
        id: '1',
        isExpanded: true
    },
    {
        name: 'Work',
        expandable: true,
        level: 1,
        icon: 'lucideFolder',
        expandedIcon: 'lucideFolderOpen',
        id: '1-1'
    },
    {
        name: 'Project A',
        expandable: false,
        level: 2,
        icon: 'lucideFile',
        id: '1-1-1'
    },
    {
        name: 'Project B',
        expandable: false,
        level: 2,
        icon: 'lucideFile',
        id: '1-1-2'
    },
    {
        name: 'Personal',
        expandable: true,
        level: 1,
        icon: 'lucideFolder',
        expandedIcon: 'lucideFolderOpen',
        id: '1-2'
    },
    {
        name: 'Resume.pdf',
        expandable: false,
        level: 2,
        icon: 'lucideFile',
        id: '1-2-1'
    },
    {
        name: 'Photos',
        expandable: true,
        level: 0,
        icon: 'lucideFolder',
        expandedIcon: 'lucideFolderOpen',
        id: '2'
    },
    {
        name: 'Vacation',
        expandable: false,
        level: 1,
        icon: 'lucideFile',
        id: '2-1'
    },
];

export const Default: Story = {
    args: {
        data: treeData,
    },
    render: (args) => ({
        props: {
            ...args,
            onNodeClick: (node: TreeNode) => console.log('Node clicked:', node)
        },
        template: `
            <div class="w-64 border rounded p-4">
                <mmc-tree-view
                    [data]="data"
                    (nodeClick)="onNodeClick($event)"
                ></mmc-tree-view>
            </div>
        `,
    }),
};

export const WithSelection: Story = {
    args: {
        data: treeData,
        selectedNodeId: '1-1-1',
    },
    render: (args) => ({
        props: {
            ...args,
            onNodeClick: (node: TreeNode) => console.log('Node clicked:', node)
        },
        template: `
            <div class="w-64 border rounded p-4">
                <mmc-tree-view
                    [data]="data"
                    [selectedNodeId]="selectedNodeId"
                    (nodeClick)="onNodeClick($event)"
                ></mmc-tree-view>
            </div>
        `,
    }),
};

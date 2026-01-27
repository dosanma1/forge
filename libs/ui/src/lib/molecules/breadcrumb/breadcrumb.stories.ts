import { Meta, moduleMetadata, StoryObj } from '@storybook/angular';
import { MmcBreadcrumb } from './breadcrumb.component';
import { MmcBreadcrumbService } from './breadcrumb.service';

const meta: Meta<MmcBreadcrumb> = {
    title: 'Molecules/Breadcrumb',
    component: MmcBreadcrumb,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [MmcBreadcrumb],
            providers: [MmcBreadcrumbService],
        }),
    ],
};

export default meta;
type Story = StoryObj<MmcBreadcrumb>;

export const Default: Story = {
    decorators: [
        moduleMetadata({
            providers: [
                {
                    provide: MmcBreadcrumbService,
                    useValue: {
                        breadcrumb: () => [
                            { label: 'Home', url: '/' },
                            { label: 'Products', url: '/products' },
                            { label: 'Electronics', url: '/products/electronics' },
                        ],
                    },
                },
            ],
        }),
    ],
};

export const Short: Story = {
    decorators: [
        moduleMetadata({
            providers: [
                {
                    provide: MmcBreadcrumbService,
                    useValue: {
                        breadcrumb: () => [
                            { label: 'Home', url: '/' },
                            { label: 'Dashboard', url: '/dashboard' },
                        ],
                    },
                },
            ],
        }),
    ],
};

export const Long: Story = {
    decorators: [
        moduleMetadata({
            providers: [
                {
                    provide: MmcBreadcrumbService,
                    useValue: {
                        breadcrumb: () => [
                            { label: 'Home', url: '/' },
                            { label: 'Products', url: '/products' },
                            { label: 'Electronics', url: '/products/electronics' },
                            { label: 'Computers', url: '/products/electronics/computers' },
                            { label: 'Laptops', url: '/products/electronics/computers/laptops' },
                            {
                                label: 'Gaming Laptops',
                                url: '/products/electronics/computers/laptops/gaming',
                            },
                        ],
                    },
                },
            ],
        }),
    ],
};

export const Single: Story = {
    decorators: [
        moduleMetadata({
            providers: [
                {
                    provide: MmcBreadcrumbService,
                    useValue: {
                        breadcrumb: () => [{ label: 'Current Page', url: '/current' }],
                    },
                },
            ],
        }),
    ],
};

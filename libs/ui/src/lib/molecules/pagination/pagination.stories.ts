import { Meta, StoryObj, moduleMetadata } from '@storybook/angular';
import { NgpPagination } from 'ng-primitives/pagination';
import { PaginationComponent } from './pagination.component';

const meta: Meta<PaginationComponent> = {
    title: 'Molecules/Pagination',
    component: PaginationComponent,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [PaginationComponent, NgpPagination],
        }),
    ],
};

export default meta;
type Story = StoryObj<PaginationComponent>;

export const Default: Story = {
    render: () => ({
        props: {
            page: 1,
            pageCount: 10,
            disabled: false,
        },
        template: `
            <mmc-pagination
                [page]="page"
                [pageCount]="pageCount"
                [disabled]="disabled"
                (pageChange)="page = $event"
            ></mmc-pagination>
        `,
    }),
};

export const ManyPages: Story = {
    render: () => ({
        props: {
            page: 1,
            pageCount: 100,
            disabled: false,
        },
        template: `
            <mmc-pagination
                [page]="page"
                [pageCount]="pageCount"
                [disabled]="disabled"
                (pageChange)="page = $event"
            ></mmc-pagination>
        `,
    }),
};

export const Disabled: Story = {
    render: () => ({
        props: {
            page: 1,
            pageCount: 10,
            disabled: true,
        },
        template: `
            <mmc-pagination
                [page]="page"
                [pageCount]="pageCount"
                [disabled]="disabled"
                (pageChange)="page = $event"
            ></mmc-pagination>
        `,
    }),
};

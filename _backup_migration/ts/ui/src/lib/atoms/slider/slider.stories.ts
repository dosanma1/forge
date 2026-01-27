import { signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcLabel } from '../label/label.directive';
import { MmcSlider } from './slider.component';

const meta: Meta<MmcSlider> = {
    title: 'Atoms/Slider',
    component: MmcSlider,
    tags: ['autodocs'],
    decorators: [
        moduleMetadata({
            imports: [MmcSlider, MmcLabel, FormsModule],
        }),
    ],
};

export default meta;
type Story = StoryObj<MmcSlider>;

export const Default: Story = {
    render: () => ({
        props: {
            value: signal(50),
        },
        template: `
			<div class="w-80 space-y-2">
				<label mmcLabel>Volume: {{value()}}</label>
				<mmc-slider [(ngModel)]="value" [min]="0" [max]="100" [step]="1" />
			</div>
		`,
    }),
};

export const Range: Story = {
    render: () => ({
        props: {
            value: signal(75),
        },
        template: `
			<div class="w-80 space-y-2">
				<label mmcLabel>Price: \${{value()}}</label>
				<mmc-slider [(ngModel)]="value" [min]="0" [max]="200" [step]="5" />
				<p class="text-xs text-muted-foreground">Range: \$0 - \$200</p>
			</div>
		`,
    }),
};

export const Steps: Story = {
    render: () => ({
        props: {
            value: signal(50),
        },
        template: `
			<div class="w-80 space-y-2">
				<label mmcLabel>Value: {{value()}}</label>
				<mmc-slider [(ngModel)]="value" [min]="0" [max]="100" [step]="10" />
				<p class="text-xs text-muted-foreground">Step size: 10</p>
			</div>
		`,
    }),
};

export const Disabled: Story = {
    render: () => ({
        props: {
            value: signal(60),
        },
        template: `
			<div class="w-80 space-y-2">
				<label mmcLabel>Disabled: {{value()}}</label>
				<mmc-slider [ngModel]="value()" [min]="0" [max]="100" [step]="1" [disabled]="true" />
			</div>
		`,
    }),
};

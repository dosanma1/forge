import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { provideTooltipConfig } from 'ng-primitives/tooltip';
import { MmcButton } from '../button/button.component';
import { MmcTooltipTrigger } from './tooltip-trigger.directive';
import { MmcTooltip } from './tooltip.directive';

const meta: Meta<MmcTooltip> = {
	title: 'Atoms/Tooltip',
	component: MmcTooltip,
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [MmcButton, MmcTooltip, MmcTooltipTrigger],
			providers: [
				provideTooltipConfig({
					showDelay: 0,
					hideDelay: 0,
				}),
			],
		}),
	],
};

export default meta;
type Story = StoryObj<MmcTooltip>;

export const Default: Story = {
	render: () => ({
		template: `
			<div class="flex justify-center p-8">
				<button [mmcTooltipTrigger]="tooltip" mmcButton>Hover me</button>

				<ng-template #tooltip>
					<div mmcTooltip>This is a tooltip</div>
				</ng-template>
			</div>
		`,
	}),
};

export const Top: Story = {
	render: () => ({
		template: `
			<div class="flex justify-center p-8">
				<button [mmcTooltipTrigger]="tooltip" [placement]="'top'" mmcButton>
					Tooltip on top
				</button>

				<ng-template #tooltip>
					<div mmcTooltip>I appear above!</div>
				</ng-template>
			</div>
		`,
	}),
};

export const Bottom: Story = {
	render: () => ({
		template: `
			<div class="flex justify-center p-8">
				<button [mmcTooltipTrigger]="tooltip" [placement]="'bottom'" mmcButton>
					Tooltip on bottom
				</button>

				<ng-template #tooltip>
					<div mmcTooltip>I appear below!</div>
				</ng-template>
			</div>
		`,
	}),
};

export const Left: Story = {
	render: () => ({
		template: `
			<div class="flex justify-center p-8">
				<button [mmcTooltipTrigger]="tooltip" [placement]="'left'" mmcButton>
					Tooltip on left
				</button>

				<ng-template #tooltip>
					<div mmcTooltip>I appear on the left!</div>
				</ng-template>
			</div>
		`,
	}),
};

export const Right: Story = {
	render: () => ({
		template: `
			<div class="flex justify-center p-8">
				<button [mmcTooltipTrigger]="tooltip" [placement]="'right'" mmcButton>
					Tooltip on right
				</button>

				<ng-template #tooltip>
					<div mmcTooltip>I appear on the right!</div>
				</ng-template>
			</div>
		`,
	}),
};

export const WithDelay: Story = {
	render: () => ({
		template: `
			<div class="flex justify-center p-8">
				<button 
					[mmcTooltipTrigger]="tooltip" 
					[showDelay]="500"
					[hideDelay]="200"
					mmcButton
				>
					Hover (500ms delay)
				</button>

				<ng-template #tooltip>
					<div mmcTooltip>This tooltip appears after 500ms</div>
				</ng-template>
			</div>
		`,
	}),
};

export const LongContent: Story = {
	render: () => ({
		template: `
			<div class="flex justify-center p-8">
				<button [mmcTooltipTrigger]="tooltip" mmcButton>
					Hover for long content
				</button>

				<ng-template #tooltip>
					<div mmcTooltip>
						This is a longer tooltip with multiple lines of text.
						Tooltips automatically wrap content and have a maximum width.
					</div>
				</ng-template>
			</div>
		`,
	}),
};

export const Multiple: Story = {
	render: () => ({
		template: `
			<div class="flex justify-center gap-4 p-8">
				<button [mmcTooltipTrigger]="tooltip1" mmcButton variant="default">
					Default
				</button>
				<ng-template #tooltip1>
					<div mmcTooltip>Default button tooltip</div>
				</ng-template>

				<button [mmcTooltipTrigger]="tooltip2" mmcButton variant="secondary">
					Secondary
				</button>
				<ng-template #tooltip2>
					<div mmcTooltip>Secondary button tooltip</div>
				</ng-template>

				<button [mmcTooltipTrigger]="tooltip3" mmcButton variant="outline">
					Outline
				</button>
				<ng-template #tooltip3>
					<div mmcTooltip>Outline button tooltip</div>
				</ng-template>
			</div>
		`,
	}),
};

import { ChangeDetectionStrategy, Component, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { type Meta, type StoryObj, moduleMetadata } from '@storybook/angular';
import { MmcButton } from '../button/button.component';
import { MmcIcon } from '../icon/icon.component';
import { MmcMenuGroup } from '../menu/menu-group.directive';
import { MmcMenuItemIndicator } from '../menu/menu-item-indicator.component';
import { MmcMenuItemRadio } from '../menu/menu-item-radio.directive';
import { MmcMenu } from '../menu/menu.directive';
import { MmcPopoverOrigin } from '../popover/popover-origin.directive';
import { MmcPopover } from '../popover/popover.component';
import { MmcButtonGroup } from './button-group.component';

@Component({
	selector: 'mmc-show-case-popover',
	template: `
		<mmc-button-group>
			<button mmcButton>
				{{ options[selectedIndex()].label }}
			</button>
			<button
				mmcButton
				mmcPopoverOrigin
				#popoverTrigger="mmcPopoverOrigin"
				size="icon"
				aria-label="Options"
				(click)="toggle()"
			>
				<mmc-icon
					size="sm"
					name="lucideChevronDown"
					aria-hidden="true"
				/>
			</button>
			<mmc-popover
				[(isOpen)]="isOpen"
				[stretchToOrigin]="false"
				[origin]="popoverTrigger"
				[offsetY]="5"
				[offsetX]="-145"
				[outsideClose]="true"
				[styled]="true"
				[positionY]="'bottom'"
				class="max-w-64 md:max-w-xs"
			>
				<ng-template>
					<div mmcMenu>
						<div role="group" mmcMenuGroup>
							@for (option of options; track $index) {
								<button
									mmcMenuItemRadio
									[selected]="selectedIndex() === $index"
									class="justify-start"
									(triggered)="onTriggered($index)"
								>
									<span
										mmcMenuItemIndicator
										[show]="selectedIndex() === $index"
									></span>

									<div class="flex flex-col gap-1 text-left">
										<span class="text-sm font-medium">
											{{ option.label }}
										</span>
										<span
											class="text-muted-foreground text-xs"
										>
											{{ option.description }}
										</span>
									</div>
								</button>
							}
						</div>
					</div>
				</ng-template>
			</mmc-popover>
		</mmc-button-group>
	`,
	imports: [
		MmcPopoverOrigin,
		MmcButton,
		MmcPopover,
		MmcIcon,
		MmcButtonGroup,
		MmcMenu,
		MmcMenuItemRadio,
		MmcMenuItemIndicator,
		MmcMenuGroup,
	],
	viewProviders: [provideIcons({ lucideChevronDown })],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShowCaseButtonGroupComponent {
	options = [
		{
			label: 'Merge pull request',
			description:
				'All commits from this branch will be added to the base branch via a commit version.',
		},
		{
			label: 'Squash and merge',
			description:
				'The 6 commits from this branch will be combined into one commit in the base branch.',
		},
		{
			label: 'Rebase and merge',
			description:
				'The 6 commits from this branch will be rebased and added to the base branch.',
		},
	];
	selectedIndex = signal(0);

	isOpen = signal(false);

	toggle() {
		this.isOpen.update((isOpen) => !isOpen);
	}

	onTriggered(index: number): void {
		this.selectedIndex.set(index);
		this.isOpen.set(false);
	}
}

const meta: Meta<ShowCaseButtonGroupComponent> = {
	title: 'Atoms/Button Group',
	component: ShowCaseButtonGroupComponent,
	tags: ['autodocs'],
	decorators: [
		moduleMetadata({
			imports: [ShowCaseButtonGroupComponent],
		}),
	],
};

export default meta;
type Story = StoryObj<ShowCaseButtonGroupComponent>;

export const Default: Story = {};

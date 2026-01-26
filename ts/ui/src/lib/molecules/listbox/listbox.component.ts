import { BooleanInput } from '@angular/cdk/coercion';
import { NgTemplateOutlet } from '@angular/common';
import {
	booleanAttribute,
	Component,
	computed,
	contentChild,
	contentChildren,
	forwardRef,
	input,
	model,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { ClassValue } from 'clsx';
import { NgpSelectionMode } from 'ng-primitives/common';
import {
	injectListboxState,
	NgpListbox,
	NgpListboxTrigger,
	provideListboxState,
} from 'ng-primitives/listbox';
import { NgpPopover, NgpPopoverTrigger } from 'ng-primitives/popover';
import { ChangeFn, provideValueAccessor, TouchedFn } from 'ng-primitives/utils';
import { cn } from '../../../helpers/cn';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { ListboxLabelDirective } from './listbox-label.directive';
import { MmcListboxOption } from './listbox-option.component';

@Component({
	selector: 'mmc-listbox',
	providers: [
		provideIcons({ lucideChevronDown }),
		provideListboxState(),
		provideValueAccessor(MmcListbox),
	],
	imports: [
		NgTemplateOutlet,
		NgpPopoverTrigger,
		NgpListbox,
		NgpListboxTrigger,
		MmcButton,
		NgpPopover,
		MmcIcon,
	],
	template: `
		<button
			[ngpPopoverTrigger]="dropdown"
			mmcButton
			variant="outline"
			ngpListboxTrigger
			[class]="classNames()"
		>
			<div class="truncate">
				@if (value().length > 0) {
					@if (templateLabel(); as templateLabel) {
						<ng-container
							*ngTemplateOutlet="
								templateLabel.templateRef;
								context: { $implicit: value() }
							"
						></ng-container>
					} @else {
						<span class="flex-1 truncate text-left">
							{{ value().join(', ') }}
						</span>
					}
				} @else {
					{{ placeholder() }}
				}
			</div>
			<mmc-icon size="sm" name="lucideChevronDown"></mmc-icon>
		</button>

		<ng-template #dropdown>
			<div
				[(ngpListboxValue)]="value"
				[ngpListboxMode]="mode()"
				[ngpListboxDisabled]="disabled()"
				[ngpListboxCompareWith]="compareWith()"
				ngpPopover
				ngpListbox
				class="absolute w-[--ngp-popover-trigger-width] border-input bg-popover text-popover-foreground z-50 max-h-52 min-w-32 overflow-y-auto rounded-md border shadow-lg p-1 [&_[role=group]]:py-1"
			>
				<ng-content />
			</div>
		</ng-template>
	`,
})
export class MmcListbox implements ControlValueAccessor {
	public readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected classNames = computed(() =>
		cn(
			'justify-between disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&>span]:line-clamp-1',
			this.additionalClasses(),
		),
	);

	/**
	 * Access the listbox state
	 */
	protected readonly state = injectListboxState<NgpListbox<string>>();

	protected readonly options = contentChildren<MmcListboxOption>(
		forwardRef(() => MmcListboxOption),
		{ descendants: true },
	);

	protected readonly templateLabel = contentChild<ListboxLabelDirective>(
		ListboxLabelDirective,
	);

	/**
	 * The listbox mode.
	 */
	readonly mode = input<NgpSelectionMode>('single');

	/**
	 * The listbox value.
	 */
	readonly value = model<string[]>([]);

	/**
	 * The listbox disabled state.
	 */
	readonly disabled = input<boolean, BooleanInput>(false, {
		transform: booleanAttribute,
	});

	/**
	 * The comparator function to use when comparing values.
	 */
	readonly compareWith = input<(a: string, b: string) => boolean>(
		(a, b) => a === b,
	);

	/**
	 * The placeholder text.
	 */
	readonly placeholder = input<string>('Select an option');

	/**
	 * The onChange callback.
	 */
	protected onChange?: ChangeFn<string[]>;

	/**
	 * The onTouch callback.
	 */
	protected onTouch?: TouchedFn;

	writeValue(value: string[]): void {
		this.state()?.value.set(value);
	}

	registerOnChange(fn: ChangeFn<string[]>): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: TouchedFn): void {
		this.onTouch = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.state()?.disabled.set(isDisabled);
	}
}

import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideCheck, lucideMinus } from '@ng-icons/lucide';
import { ClassValue } from 'clsx';
import { injectCheckboxState, NgpCheckbox } from 'ng-primitives/checkbox';
import { ChangeFn, provideValueAccessor, TouchedFn } from 'ng-primitives/utils';
import { cn } from '../../../helpers/cn';
import { MmcIcon } from '../icon/icon.component';

@Component({
	selector: 'mmc-checkbox',
	template: `
		@if (state().indeterminate()) {
			<mmc-icon size="xs" name="lucideMinus"></mmc-icon>
		} @else if (state().checked()) {
			<mmc-icon size="xs" name="lucideCheck"></mmc-icon>
		}
	`,
	hostDirectives: [
		{
			directive: NgpCheckbox,
			inputs: [
				'ngpCheckboxChecked:checked',
				'ngpCheckboxIndeterminate:indeterminate',
				'ngpCheckboxDisabled:disabled',
			],
			outputs: [
				'ngpCheckboxCheckedChange:checkedChange',
				'ngpCheckboxIndeterminateChange:indeterminateChange',
			],
		},
	],
	imports: [MmcIcon],
	providers: [
		provideValueAccessor(MmcCheckbox),
		provideIcons({ lucideCheck, lucideMinus }),
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		'[class]': 'classNames()',
		'(focusout)': 'onTouchedFn?.()',
		'[attr.id]': 'id()',
	},
})
export class MmcCheckbox implements ControlValueAccessor {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	readonly id = input<string>();

	protected readonly state = injectCheckboxState();

	protected onChangeFn?: ChangeFn<boolean>;
	protected onTouchedFn?: TouchedFn;

	protected classNames = computed(() =>
		cn(
			'inline-flex items-center justify-center',
			'peer size-4 shrink-0 rounded border border-input shadow-sm shadow-black/5 outline-offset-2',
			'focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70',
			'disabled:cursor-not-allowed disabled:opacity-50',
			'data-[checked]:border-primary data-[indeterminate]:border-primary data-[checked]:bg-primary data-[indeterminate]:bg-primary data-[checked]:text-primary-foreground data-[indeterminate]:text-primary-foreground',
			this.additionalClasses(),
		),
	);

	constructor() {
		// Whenever the user interacts with the checkbox, call the onChange function with the new value.
		this.state().checkedChange.subscribe((checked) =>
			this.onChangeFn?.(checked),
		);
	}

	writeValue(checked: boolean): void {
		this.state().checked.set(checked);
	}

	registerOnChange(fn: ChangeFn<boolean>): void {
		this.onChangeFn = fn;
	}

	registerOnTouched(fn: TouchedFn): void {
		this.onTouchedFn = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		this.state().disabled.set(isDisabled);
	}
}

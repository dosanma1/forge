import { Component, computed, input } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { ClassValue } from 'clsx';
import { injectRadioGroupState, NgpRadioGroup } from 'ng-primitives/radio';
import { ChangeFn, provideValueAccessor, TouchedFn } from 'ng-primitives/utils';
import { cn } from '../../../helpers/cn';

export type RadioVariants = NonNullable<'default'>;

@Component({
	selector: 'mmc-radio-group',
	hostDirectives: [
		{
			directive: NgpRadioGroup,
			inputs: [
				'ngpRadioGroupValue:value',
				'ngpRadioGroupDisabled:disabled',
				'ngpRadioGroupOrientation:orientation',
			],
			outputs: ['ngpRadioGroupValueChange:valueChange'],
		},
	],
	providers: [provideValueAccessor(MmcRadioGroup)],
	template: `
		<!-- @switch (variant()) {
			@case ('primary') {
				<mmc-table-primary> </mmc-table-primary>
			}
			@case ('outline') {
				<mmc-table-outline> </mmc-table-outline>
			}
			@default {
				<mmc-table-primary> </mmc-table-primary>
			}
		} -->
		<ng-content />
	`,
	host: {
		'[class]': 'classNames()',
		'(focusout)': 'onTouched?.()',
	},
})
export class MmcRadioGroup implements ControlValueAccessor {
	readonly variant = input<RadioVariants>('default');
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	protected readonly state = injectRadioGroupState<string>();
	protected onTouched?: TouchedFn;
	private onChange?: ChangeFn<string | null>;

	protected classNames = computed(() =>
		// cn('grid gap-3', this.additionalClasses()),
		cn('flex flex-col gap-y-4', this.additionalClasses()),
	);

	constructor() {
		this.state().valueChange.subscribe((value) => this.onChange?.(value));
	}

	writeValue(value: string): void {
		this.state().value.set(value);
	}

	registerOnChange(onChange: ChangeFn<string | null>): void {
		this.onChange = onChange;
	}

	registerOnTouched(onTouched: TouchedFn): void {
		this.onTouched = onTouched;
	}
}

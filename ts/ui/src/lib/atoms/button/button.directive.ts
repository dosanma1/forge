import { BooleanInput } from '@angular/cdk/coercion';
import { booleanAttribute, computed, Directive, input } from '@angular/core';

export type ButtonType = 'button' | 'submit' | 'reset';

let buttonId = 0;

@Directive({
	selector: 'button[mmcButton]',
	standalone: true,
	host: {
		'[attr.id]': 'id()',
		'[attr.type]': 'type()',
		'[attr.tabindex]': 'tabIndex()',

		'[attr.aria-disabled]': 'ariaDisabled()',
		'[attr.aria-pressed]': 'isActive()',

		'[attr.disabled]': 'attrDisabled()',
	},
})
export abstract class MmcButtonDirective {
	readonly id = input<string>(`mmc-button-${buttonId++}`);
	readonly type = input<ButtonType>('button');
	readonly active = input<boolean, BooleanInput>(false, {
		transform: booleanAttribute,
	});
	readonly loading = input<boolean, BooleanInput>(false, {
		transform: booleanAttribute,
	});
	readonly loadingMsg = input<string>('Loading...');
	readonly disabled = input<boolean, BooleanInput>(false, {
		transform: booleanAttribute,
	});

	private readonly _disabled = computed(() => this.disabled());

	readonly ariaDisabled = computed(() => {
		return this._disabled() ? true : undefined;
	});
	readonly attrDisabled = computed(() => {
		return this._disabled() ? '' : undefined;
	});
	readonly tabIndex = computed(() => {
		return this._disabled() ? '-1' : undefined;
	});
	readonly isActive = computed(() => {
		return <boolean>this.active() || undefined;
	});
}

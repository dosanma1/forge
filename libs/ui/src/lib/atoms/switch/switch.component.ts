import {
	animate,
	state,
	style,
	transition,
	trigger,
} from '@angular/animations';
import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	input,
} from '@angular/core';
import {
	AbstractControl,
	ControlValueAccessor,
	NG_VALIDATORS,
	ValidationErrors,
	Validator,
} from '@angular/forms';
import { provideAnimations } from '@angular/platform-browser/animations';
import { ClassValue } from 'clsx';
import { injectSwitchState, NgpSwitch } from 'ng-primitives/switch';
import { ChangeFn, provideValueAccessor, TouchedFn } from 'ng-primitives/utils';
import { cn } from '../../../helpers/cn';

let switchId = 0;

const genSwitchId = () => {
	return `switch-${switchId++}`;
};

@Component({
	selector: 'mmc-switch',
	standalone: true,
	template: `
		<span
			aria-hidden="true"
			[@toggleTrigger]="state().checked() ? 'on' : 'off'"
			class="bg-background pointer-events-none block size-4 rounded-full shadow-xs ring-0 transition-transform"
		></span>
	`,
	providers: [
		provideValueAccessor(MmcSwitch),
		{
			provide: NG_VALIDATORS,
			useExisting: MmcSwitch,
			multi: true,
		},
		provideAnimations(),
	],
	hostDirectives: [
		{
			directive: NgpSwitch,
			inputs: [
				'ngpSwitchChecked:checked',
				'ngpSwitchDisabled:disabled',
			],
			outputs: ['ngpSwitchCheckedChange:checkedChange'],
		},
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	animations: [
		trigger('toggleTrigger', [
			state('off', style({ transform: 'translateX(0%)' })),
			state('on', style({ transform: 'translateX(77%)' })),
			transition('on <=> off', [animate('120ms ease-in-out')]),
		]),
	],
	host: {
		'[class]': 'classNames()',
		'[attr.id]': 'id()',
		'[attr.aria-label]': 'ariaLabel()',
		'[attr.aria-labelledby]': 'ariaLabelledby()',
		'[attr.aria-describedby]': 'ariaDescribedby()',
	},
})
export class MmcSwitch implements ControlValueAccessor, Validator {
	public readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	public readonly id = input(genSwitchId());
	public readonly required = input<boolean>(false);
	public readonly ariaLabel = input<string | null>(null, {
		alias: 'aria-label',
	});
	public readonly ariaLabelledby = input<string | null>(null, {
		alias: 'aria-labelledby',
	});
	public readonly ariaDescribedby = input<string | null>(null, {
		alias: 'aria-describedby',
	});

	protected readonly state = injectSwitchState();
	protected onChangeFn?: ChangeFn<boolean>;
	protected onTouchedFn?: TouchedFn;
	private _validatorChangefn?: () => void;

	protected classNames = computed(() =>
		cn(
			'peer focus-visible:ring-ring/50 inline-flex h-5 w-8 shrink-0 items-center rounded-full border-2 border-transparent transition-all',
			'outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
			'bg-input aria-checked:bg-primary',
			this.additionalClasses(),
		),
	);

	constructor() {
		this.state().checkedChange.subscribe((checked) =>
			this.onChangeFn?.(checked),
		);

		// Trigger validator change when required input changes
		effect(() => {
			this.required();
			this._validatorChangefn?.();
		});
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

	registerOnValidatorChange(fn: () => void): void {
		this._validatorChangefn = fn;
	}

	validate(control: AbstractControl<boolean>): ValidationErrors | null {
		const hasRequiredValidator = this.required();
		return hasRequiredValidator && control.value !== true
			? { required: true }
			: null;
	}
}

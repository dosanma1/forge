import {
	ChangeDetectionStrategy,
	Component,
	computed,
	contentChild,
	contentChildren,
	ElementRef,
	forwardRef,
	inject,
	Injector,
	input,
	OnDestroy,
	signal,
	viewChild,
} from '@angular/core';
import {
	ControlValueAccessor,
	NG_VALUE_ACCESSOR,
	ReactiveFormsModule,
} from '@angular/forms';

import { ActiveDescendantKeyManager } from '@angular/cdk/a11y';
import { SelectionModel } from '@angular/cdk/collections';
import { NgClass, NgTemplateOutlet } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { VariantProps } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { map } from 'rxjs';
import { cn } from '../../../helpers/cn';
import { buttonVariants, MmcButton } from '../../atoms/button/button.component';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { MmcPopoverOrigin } from '../../atoms/popover/popover-origin.directive';
import {
	MmcPopover,
	POPOVER_POSITIONS_Y,
} from '../../atoms/popover/popover.component';
import { OptionComponent } from './option.component';
import { SelectLabelDirective } from './select-label.directive';

type OnTouchedFunction = VoidFunction | undefined;

export type OnChangeFunction = ((_: unknown) => void) | undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type CompareWith = (o1: any, o2: any) => boolean;

export type SelectVariants = VariantProps<typeof buttonVariants>;

@Component({
	selector: 'mmc-select',
	templateUrl: './select.component.html',
	styleUrl: './select.component.scss',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: SelectComponent,
		},
	],
	imports: [
		NgClass,
		NgTemplateOutlet,
		ReactiveFormsModule,
		MmcPopoverOrigin,
		MmcPopover,
		MmcButton,
		MmcIcon,
	],
	viewProviders: [provideIcons({ lucideChevronDown })],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		role: 'combobox',
		'[attr.aria-expanded]': 'isOpen()',
	},
})
export class SelectComponent implements ControlValueAccessor, OnDestroy {
	public readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	public readonly variant = input<SelectVariants['variant']>('default');
	public readonly loading = input<boolean>(false);
	public readonly withIcon = input<boolean>(true);
	public readonly positionY = input<POPOVER_POSITIONS_Y>('bottom');

	protected classNames = computed(() =>
		cn(
			'justify-between disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&>span]:line-clamp-1',
			this.additionalClasses(),
			{
				'cursor-not-allowed opacity-50':
					this.loading() || this.disabled(),
			},
		),
	);

	multiple = input(false);
	placeholder = input<string>();
	// EXPAND_MORE_ICON = matExpandMore;

	options = contentChildren<OptionComponent>(
		forwardRef(() => OptionComponent),
		{ descendants: true },
	);
	private keyManager = new ActiveDescendantKeyManager(
		this.options,
		inject(Injector),
	).withTypeAhead();

	templateLabel = contentChild<SelectLabelDirective>(SelectLabelDirective);

	selectOption = viewChild<ElementRef<HTMLElement>>('selectOption');

	compareWith = input<CompareWith, CompareWith>(
		(o1: unknown, o2: unknown) => o1 === o2,
		{
			transform: (value) => {
				this._selectionModel.compareWith = value;
				this._selectionModel.setSelection(
					this._selectionModel.selected,
				);
				return value;
			},
		},
	);
	isOpen = signal(false);
	disabled = signal(false);
	stretch = input(true);

	activeDescendantId = toSignal(
		this.keyManager.change.pipe(
			map(() => this.keyManager.activeItem?.id()),
		),
	);

	onKeydown($event: KeyboardEvent) {
		if ($event.key === 'Enter' && this.keyManager.activeItem) {
			this.toggleValue(this.keyManager.activeItem);
		}
		this.keyManager.onKeydown($event);
	}

	private _selectionModel = new SelectionModel(true);
	private _onTouched: OnTouchedFunction;
	private _registerOnChangeFn: OnChangeFunction;

	values = toSignal(
		this._selectionModel.changed.pipe(
			map(() => this._selectionModel.selected),
		),
	);

	selectedOptions = computed(() => {
		const valueOptions = this.options().filter((option) =>
			this.isSelected(option.value()),
		);
		return valueOptions;
	});

	selectedOptionsLabel = computed(() => {
		const selectedOptions = this.selectedOptions();
		if (selectedOptions?.length) {
			return selectedOptions.map((opt) => opt.content).join(', ');
		}
		return '';
	});

	isSelected(value: unknown) {
		this.values();
		return this._selectionModel.isSelected(value);
	}

	writeValue(values: unknown): void {
		if (values === null || values === undefined || values === '') {
			this._selectionModel.clear();
			return;
		}
		if (this.multiple()) {
			this._selectionModel.setSelection(...(values as unknown[]));
		} else {
			this._selectionModel.setSelection(values);
		}
	}

	toggleValue(option: OptionComponent) {
		this.keyManager.setActiveItem(option);
		const value = option.value();
		if (!this.multiple()) {
			this._selectionModel.clear(false);
		}
		this._selectionModel.toggle(value);
		const flattenedValues = this.multiple()
			? this._selectionModel.selected
			: this._selectionModel.selected[0];

		this._registerOnChangeFn?.(flattenedValues);

		if (!this.multiple()) {
			this.isOpen.set(false);
		}
	}

	registerOnChange(fn: OnChangeFunction): void {
		this._registerOnChangeFn = fn;
	}

	registerOnTouched(fn: OnTouchedFunction): void {
		this._onTouched = fn;
	}

	setDisabledState?(isDisabled: boolean): void {
		this.disabled.set(isDisabled);
	}

	togglePanel() {
		this.isOpen.update((isOpen) => !isOpen);
	}

	panelOpened() {
		this.selectOption()?.nativeElement.focus();
		this.keyManager.activeItem?.scrollIntoView();
		const selectedOptions = this.selectedOptions();

		if (selectedOptions.length) {
			this.keyManager.setActiveItem(selectedOptions[0]);
		}
	}

	panelClosed() {
		this._onTouched?.();
	}

	ngOnDestroy(): void {
		this.keyManager.destroy();
	}
}

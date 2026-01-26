import {
	ChangeDetectionStrategy,
	Component,
	computed,
	effect,
	input,
	OnDestroy,
	output,
	signal,
} from '@angular/core';
import {
	ControlValueAccessor,
	FormsModule,
	NG_VALUE_ACCESSOR,
	ReactiveFormsModule,
} from '@angular/forms';

import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';
import { MmcPopoverOrigin } from '../../atoms/popover/popover-origin.directive';
import {
	MmcPopover,
	POPOVER_POSITIONS_Y,
} from '../../atoms/popover/popover.component';
import { MmcSpinner } from '../../atoms/spinner/spinner.component';
import { MmcInputSearch } from '../inputs/input-search/input-search.component';

export interface AutocompleteOption {
	value: unknown;
	label: string;
	disabled?: boolean;
}

type OnTouchedFunction = VoidFunction | undefined;
export type AutocompleteOnChangeFunction = ((_: unknown) => void) | undefined;
export type AutocompleteCompareWith = (o1: unknown, o2: unknown) => boolean;

/**
 * Autocomplete Component
 *
 * A simple autocomplete that combines mmc-input-search with a dropdown list of options.
 * The component re-emits search events from the input-search and displays options passed by parent.
 * Parent component is responsible for filtering options based on search terms.
 *
 * @example
 * ```typescript
 * // In your component
 * protected readonly countries = signal<AutocompleteOption[]>([]);
 * protected readonly isLoadingCountries = signal<boolean>(false);
 *
 * protected onSearchCountries(searchTerm: string): void {
 *   this.isLoadingCountries.set(true);
 *   // Filter your data or make API call
 *   this.apiService.searchCountries(searchTerm).subscribe(results => {
 *     this.countries.set(results.map(country => ({
 *       value: country.code,
 *       label: country.name
 *     })));
 *     this.isLoadingCountries.set(false);
 *   });
 * }
 * ```
 *
 * @example
 * ```html
 * <!-- In your template -->
 * <mmc-autocomplete
 *   formControlName="country"
 *   [options]="countries()"
 *   [loading]="isLoadingCountries()"
 *   [debounceTime]="300"
 *   placeholder="Search for a country..."
 *   (searchChange)="onSearchCountries($event)"
 * />
 * ```
 */
@Component({
	selector: 'mmc-autocomplete',
	templateUrl: './autocomplete.component.html',
	styleUrl: './autocomplete.component.scss',
	providers: [
		{
			provide: NG_VALUE_ACCESSOR,
			multi: true,
			useExisting: AutocompleteComponent,
		},
	],
	imports: [
		ReactiveFormsModule,
		FormsModule,
		MmcPopoverOrigin,
		MmcPopover,
		MmcSpinner,
		MmcInputSearch,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		role: 'combobox',
		'[attr.aria-expanded]': 'isOpen()',
		'[class]': 'hostClasses()',
	},
})
export class AutocompleteComponent implements ControlValueAccessor, OnDestroy {
	public readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});
	public readonly positionY = input<POPOVER_POSITIONS_Y>('bottom');
	public readonly placeholder = input<string>('Type to search...');
	public readonly options = input<AutocompleteOption[]>([]);
	public readonly debounceTime = input<number>(300);
	public readonly compareWith = input<AutocompleteCompareWith>(
		(o1, o2) => o1 === o2,
	);
	public readonly width = input<string>('w-full');
	public readonly disabled = input<boolean>(false);
	public readonly loading = input<boolean>(false);

	// Events
	public readonly searchChange = output<string>();

	// Internal state
	protected readonly isOpen = signal<boolean>(false);
	protected readonly selectedOption = signal<AutocompleteOption | null>(null);
	protected searchQuery = signal<string>('');
	private pendingValue: unknown = null; // Store value when set before options are loaded

	// Form control integration
	private onChange: AutocompleteOnChangeFunction = undefined;
	private onTouched: OnTouchedFunction = undefined;
	private isTouched = false;

	constructor() {
		// Watch for options changes and try to resolve pending values
		effect(() => {
			const options = this.options();
			const pendingValue = this.pendingValue;

			// If we have a pending value and options are now available, try to find the match
			if (pendingValue !== null && options.length > 0) {
				const option = options.find((opt) =>
					this.compareWith()(opt.value, pendingValue),
				);

				if (option) {
					this.selectedOption.set(option);
					this.pendingValue = null; // Clear pending value
				}
			}

			// Handle dropdown visibility based on options and search state
			if (options.length === 0) {
				// Close dropdown if there are no options
				this.isOpen.set(false);
			} else if (this.searchQuery().trim() && !this.selectedOption()) {
				// Reopen dropdown if we have options and there's an active search but no selection
				this.isOpen.set(true);
			}
		});

		// Sync searchQuery with selected option
		effect(() => {
			const selected = this.selectedOption();
			if (selected) {
				this.searchQuery.set(selected.label);
			}
		});
	}

	ngOnDestroy(): void {
		// Cleanup if needed
	}

	// Computed properties
	protected readonly hostClasses = computed(() =>
		cn('relative', this.width(), this.additionalClasses()),
	);

	protected readonly displayValue = computed(() => {
		const selected = this.selectedOption();
		return selected ? selected.label : '';
	});

	// ControlValueAccessor implementation
	writeValue(value: unknown): void {
		if (value === null || value === undefined || value === '') {
			this.selectedOption.set(null);
			this.searchQuery.set('');
			this.pendingValue = null;
			return;
		}

		const options = this.options();
		const option = options.find((opt) =>
			this.compareWith()(opt.value, value),
		);

		if (option) {
			// Found matching option, set it immediately
			this.selectedOption.set(option);
			this.pendingValue = null;
		} else {
			// No matching option found (probably options not loaded yet)
			// Store the value for later resolution
			this.pendingValue = value;
			this.selectedOption.set(null);
		}
	}

	registerOnChange(fn: AutocompleteOnChangeFunction): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: OnTouchedFunction): void {
		this.onTouched = fn;
	}

	setDisabledState(isDisabled: boolean): void {
		// The disabled state is handled via input binding
	}

	// UI interaction methods
	protected onInputFocus(): void {
		if (this.disabled()) {
			return;
		}
		this.markAsTouched();
		this.isOpen.set(true);
	}

	protected onSearchChange(searchTerm: string): void {
		// Update search query state
		this.searchQuery.set(searchTerm);

		// Emit search term to parent
		this.searchChange.emit(searchTerm);

		// Clear selection when user starts typing different text
		const selected = this.selectedOption();
		if (selected && searchTerm !== selected.label) {
			this.selectedOption.set(null);
			this.onChange?.(null);
		}

		// Open dropdown when typing, close when empty
		if (searchTerm.trim()) {
			this.isOpen.set(true);
		} else {
			this.isOpen.set(false);
		}
	}

	protected selectOption(option: AutocompleteOption): void {
		if (option.disabled || this.disabled()) {
			return;
		}

		this.selectedOption.set(option);
		this.searchQuery.set(option.label); // Update search query to match selection
		this.onChange?.(option.value);
		this.isOpen.set(false);
	}

	protected clearSelection(): void {
		if (this.disabled()) {
			return;
		}

		this.selectedOption.set(null);
		this.searchQuery.set('');
		this.pendingValue = null;
		this.onChange?.(null);
		this.isOpen.set(false);
	}

	protected onBlur(): void {
		// Don't close dropdown while loading or if disabled
		if (this.loading() || this.disabled()) {
			return;
		}

		// Close the dropdown after a small delay to allow for option selection
		setTimeout(() => {
			if (!this.loading()) {
				this.isOpen.set(false);
				this.onTouched?.();
			}
		}, 150);
	}

	protected panelClosed(): void {
		// Don't mark as closed if we're loading
		if (this.loading()) {
			return;
		}

		this.isOpen.set(false);
		this.onTouched?.();
	}

	private markAsTouched(): void {
		if (!this.isTouched) {
			this.isTouched = true;
			this.onTouched?.();
		}
	}
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  forwardRef,
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

import { NgClass } from '@angular/common';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronDown } from '@ng-icons/lucide';
import { VariantProps } from 'class-variance-authority';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';
import { buttonVariants, MmcButton } from '../../atoms/button/button.component';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { MmcPopoverOrigin } from '../../atoms/popover/popover-origin.directive';
import {
  MmcPopover,
  POPOVER_POSITIONS_Y,
} from '../../atoms/popover/popover.component';
import { MmcInputSearch } from '../inputs/input-search/input-search.component';

export interface SelectOption {
  value: unknown;
  label: string;
  disabled?: boolean;
}

type OnTouchedFunction = VoidFunction | undefined;
export type SelectWithSearchOnChangeFunction =
  | ((_: unknown) => void)
  | undefined;
export type SelectWithSearchCompareWith = (o1: unknown, o2: unknown) => boolean;
export type SelectWithSearchVariants = VariantProps<typeof buttonVariants>;

@Component({
  selector: 'mmc-select-with-search',
  templateUrl: './select-with-search.component.html',
  styleUrl: './select-with-search.component.scss',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => SelectWithSearchComponent),
    },
  ],
  imports: [
    NgClass,
    ReactiveFormsModule,
    FormsModule,
    MmcPopoverOrigin,
    MmcPopover,
    MmcButton,
    MmcIcon,
    MmcInputSearch,
  ],
  viewProviders: [
    provideIcons({
      lucideChevronDown,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    role: 'combobox',
    '[attr.aria-expanded]': 'isOpen()',
  },
})
export class SelectWithSearchComponent
  implements ControlValueAccessor, OnDestroy
{
  public readonly additionalClasses = input<ClassValue>('', {
    alias: 'class',
  });
  public readonly variant =
    input<SelectWithSearchVariants['variant']>('default');
  public readonly loading = input<boolean>(false);
  public readonly withIcon = input<boolean>(true);
  public readonly positionY = input<POPOVER_POSITIONS_Y>('bottom');
  public readonly placeholder = input<string>('Select option...');
  public readonly searchPlaceholder = input<string>('Search...');
  public readonly options = input<SelectOption[]>([]);
  public readonly clearable = input<boolean>(true);
  public readonly debounceTime = input<number>(300);
  public readonly compareWith = input<SelectWithSearchCompareWith>(
    (o1, o2) => o1 === o2,
  );
  public readonly width = input<string>('w-full');

  // Events
  public readonly searchChange = output<string>();

  // Internal state
  protected readonly isOpen = signal<boolean>(false);
  protected readonly searchTerm = signal<string>('');
  protected readonly selectedOption = signal<SelectOption | null>(null);

  // Form control integration
  private onChange: SelectWithSearchOnChangeFunction = undefined;
  private onTouched: OnTouchedFunction = undefined;
  protected readonly disabled = signal<boolean>(false);
  private touched = false;

  constructor() {
    // Watch search term changes and emit events only when control has been touched
    effect(() => {
      const term = this.searchTerm();
      // Only emit if the control has been marked as touched
      if (this.touched) {
        this.searchChange.emit(term);
      }
    });
  }

  // Filtered options based on search term
  protected readonly filteredOptions = computed(() => {
    const term = this.searchTerm().toLowerCase();
    const options = this.options();

    if (!term) {
      return options;
    }

    return options.filter((option) =>
      option.label.toLowerCase().includes(term),
    );
  });

  protected readonly classNames = computed(() =>
    cn(
      'justify-between disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&>span]:line-clamp-1 w-full flex',
      this.additionalClasses(),
      {
        'cursor-not-allowed opacity-50': this.loading() || this.disabled(),
      },
    ),
  );

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  // ControlValueAccessor implementation
  writeValue(value: unknown): void {
    const option = this.options().find((opt) =>
      this.compareWith()(opt.value, value),
    );
    this.selectedOption.set(option || null);
  }

  registerOnChange(fn: SelectWithSearchOnChangeFunction): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: OnTouchedFunction): void {
    this.onTouched = fn;
  }

  setDisabledState(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  // UI interaction methods
  protected togglePanel(): void {
    if (this.disabled() || this.loading()) {
      return;
    }

    this.isOpen.set(!this.isOpen());
  }

  protected panelOpened(): void {
    this.isOpen.set(true);
    this.markAsTouched();
    this.searchTerm.set(''); // Reset search when opening
  }

  protected panelClosed(): void {
    this.isOpen.set(false);
    this.searchTerm.set(''); // Reset search when closing
    this.onTouched?.();
  }

  private markAsTouched(): void {
    if (!this.touched) {
      this.touched = true;
      this.onTouched?.();
    }
  }

  protected selectOption(option: SelectOption): void {
    if (option.disabled) {
      return;
    }

    // If clicking the currently selected option, deselect it
    if (this.selectedOption()?.value === option.value && this.clearable()) {
      this.selectedOption.set(null);
      this.onChange?.(null);
    } else {
      this.selectedOption.set(option);
      this.onChange?.(option.value);
    }

    this.isOpen.set(false);
  }

  protected clearSelection(): void {
    this.selectedOption.set(null);
    this.onChange?.(null);
  }

  protected get selectedLabel(): string {
    return this.selectedOption()?.label || '';
  }

  protected get hasSelection(): boolean {
    return !!this.selectedOption();
  }
}

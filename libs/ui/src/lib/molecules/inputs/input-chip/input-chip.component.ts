import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  input,
  signal,
  ViewChild,
} from '@angular/core';
import {
  AbstractControl,
  ControlValueAccessor,
  NG_VALIDATORS,
  NG_VALUE_ACCESSOR,
  ValidationErrors,
  Validator,
} from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideX } from '@ng-icons/lucide';
import { ClassValue } from 'clsx';
import { cn } from '../../../../helpers/cn';
import { MmcBadge } from '../../../atoms/badge/badge.component';
import { MmcIcon } from '../../../atoms/icon/icon.component';
import { MmcInput } from '../../../atoms/input/input.directive';

let inputChipId = 0;

const genInputChipId = () => {
  return `input-chip-${inputChipId++}`;
};

type VALUE_TYPE = string[] | undefined | null;

type OnChangeFunction = ((_: unknown) => void) | undefined;

type OnTouchedFunction = VoidFunction | undefined;

type ValidatorChangeFunction = VoidFunction | undefined;

@Component({
  selector: 'mmc-input-chip',
  templateUrl: './input-chip.component.html',
  styleUrl: './input-chip.component.scss',
  imports: [NgClass, MmcInput, MmcIcon, MmcBadge],
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      multi: true,
      useExisting: forwardRef(() => MmcInputChip),
    },
    {
      provide: NG_VALIDATORS,
      useExisting: forwardRef(() => MmcInputChip),
      multi: true,
    },
  ],
  viewProviders: [provideIcons({ lucideX })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.id]': 'null',
    '[attr.aria-label]': 'null',
    '[attr.aria-labelledby]': 'null',
    '[attr.aria-describedby]': 'null',
    '[attr.disabled]': 'disabled() ? "" : null',
  },
})
export class MmcInputChip implements ControlValueAccessor, Validator {
  // private readonly inputField =
  // 	viewChild.required<ElementRef<HTMLInputElement>>('inputField');
  @ViewChild('inputField') inputField!: ElementRef<HTMLInputElement>;

  public readonly additionalClasses = input<ClassValue>('', {
    alias: 'class',
  });
  public readonly id = input(genInputChipId());
  public readonly name = input<string>();
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
  public readonly placeholder = input<string>('Type...');
  public readonly autocomplete = input<string>('off');
  public readonly removable = input<boolean>(true);
  public readonly removableAll = input<boolean>(false);

  public values = signal<VALUE_TYPE>([]);
  public readonly disabled = signal<boolean>(false);

  private _registerOnChangefn: OnChangeFunction;
  private _onTouchedfn: OnTouchedFunction;
  private _validatorChangefn: ValidatorChangeFunction;

  protected classNames = computed(() =>
    cn(
      `block h-auto w-full p-0 border border-input rounded-md focus-within:border-primary`,
      this.additionalClasses(),
    ),
  );

  constructor() {
    effect(() => {
      this.required();
      this._validatorChangefn?.();
    });
  }

  onKeyDown(event: KeyboardEvent, value: string): void {
    switch (event.keyCode) {
      case 13:
      case 188: {
        if (value && value.trim() !== '') {
          if (!this.values()?.includes(value)) {
            this.values.update((currentValues) => [
              ...(currentValues || []),
              value,
            ]);
            this.triggerChange();
          }
          this.inputField.nativeElement.value = '';
          event.preventDefault();
        }
        break;
      }
      case 8:
        if (!value && (this.values()?.length || 0) > 0) {
          this.values.set(this.values());
          this.triggerChange();
        }
        break;
      default:
        break;
    }
  }

  onChipBarClick(): void {
    this.inputField.nativeElement.focus();
  }

  removeItem(index: number): void {
    this.values.update((currentValues) => {
      if (currentValues) {
        currentValues.splice(index, 1);
      }
      return currentValues;
    });
    this.triggerChange();
  }

  removeAll(): void {
    this.values.set([]);
    this.triggerChange();
  }

  triggerChange(): void {
    if (!this._registerOnChangefn) return;

    this._registerOnChangefn(this.values());
  }

  writeValue(obj: VALUE_TYPE): void {
    this.values.set(obj);
  }

  registerOnChange(fn: OnChangeFunction): void {
    this._registerOnChangefn = fn;
  }

  registerOnValidatorChange(fn: () => void): void {
    this._validatorChangefn = fn;
  }

  registerOnTouched(fn: OnTouchedFunction): void {
    this._onTouchedfn = fn;
  }

  setDisabledState?(isDisabled: boolean): void {
    this.disabled.set(isDisabled);
  }

  validate(control: AbstractControl<boolean>): ValidationErrors | null {
    const hasRequiredValidator = this.required();
    return hasRequiredValidator && control.value !== true
      ? { required: true }
      : null;
  }
}

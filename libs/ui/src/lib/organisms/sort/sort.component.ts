import {
  CdkDrag,
  CdkDragDrop,
  CdkDragHandle,
  CdkDragPlaceholder,
  CdkDropList,
} from '@angular/cdk/drag-drop';
import { OverlayModule } from '@angular/cdk/overlay';
import { NgClass } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import {
  FormArray,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import {
  lucideArrowDownNarrowWide,
  lucideArrowUpDown,
  lucideArrowUpNarrowWide,
  lucideGripVertical,
  lucidePlus,
  lucideX,
} from '@ng-icons/lucide';
import { MmcBadge } from '../../atoms/badge/badge.component';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { OptionComponent } from '../../molecules/select/option.component';
import { SelectLabelDirective } from '../../molecules/select/select-label.directive';
import { SelectComponent } from '../../molecules/select/select.component';

export interface Field {
  name: string;
  icon?: string;
}

export interface SortField {
  field: Field;
  direction: 'ASC' | 'DESC';
}

@Component({
  selector: 'mmc-sort',
  templateUrl: './sort.component.html',
  styleUrl: './sort.component.scss',
  imports: [
    NgClass,
    ReactiveFormsModule,
    MmcButton,
    MmcIcon,
    MmcBadge,
    OverlayModule,
    CdkDropList,
    CdkDrag,
    CdkDragHandle,
    CdkDragPlaceholder,
    SelectComponent,
    OptionComponent,
    SelectLabelDirective,
  ],
  viewProviders: [
    provideIcons({
      lucideGripVertical,
      lucideArrowUpDown,
      lucideArrowUpNarrowWide,
      lucideArrowDownNarrowWide,
      lucidePlus,
      lucideX,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortComponent implements OnInit {
  private readonly fb = inject(FormBuilder);

  public readonly availableFields = input<Field[]>();
  public readonly value = input<SortField[]>();
  public readonly valueChange = output<SortField[]>();

  protected readonly directions = signal<string[]>(['ASC', 'DESC']);
  protected readonly isOpen = signal<boolean>(false);
  protected form: FormGroup = this.fb.group({
    sortFields: this.fb.array([]),
  });

  get sortFields(): FormArray {
    return this.form.controls['sortFields'] as FormArray;
  }

  get sortFieldControls(): FormGroup[] {
    return this.sortFields.controls as FormGroup[];
  }

  ngOnInit(): void {
    const val = this.value();
    if (val) {
      for (const sortField of val) {
        const sortFieldForm = this.fb.group({
          field: this.fb.group({
            name: [sortField.field.name, Validators.required],
            icon: [sortField.field.icon],
          }),
          direction: [sortField.direction, Validators.required],
        });

        this.sortFields.push(sortFieldForm);
      }
    } else {
      this.addSortField();
    }
  }

  public toggle(): void {
    this.isOpen.update((open) => !open);
  }

  protected addSortField() {
    this.sortFields.push(
      this.fb.group({
        field: this.fb.group({
          name: this.fb.control('', [Validators.required]),
          icon: this.fb.control(''),
        }),
        direction: ['', Validators.required],
      }),
    );
    this.form.markAsDirty();
  }

  protected deleteSortField(index: number) {
    this.sortFields.removeAt(index);

    if (this.sortFields.length === 0) {
      this.addSortField();
      this.close();
    }
    this.form.markAsDirty();
  }

  protected drop(event: CdkDragDrop<string[]>) {
    moveItemInFormArray(
      this.sortFields,
      event.previousIndex,
      event.currentIndex,
    );
    this.form.markAsDirty();
  }

  protected formatSortDirectionText(direction: string): string {
    if (direction == 'ASC') {
      return 'Ascending';
    }

    return 'Descending';
  }

  protected close(): void {
    if (this.form.invalid && !this.isSortEmpty()) {
      return;
    }

    if (this.form.valid) {
      this.valueChange.emit(this.sortFields.value);
    }

    if (this.isSortEmpty()) {
      this.valueChange.emit([]);
    }

    this.isOpen.set(false);
  }

  protected isSortEmpty(): boolean {
    if (this.sortFields.value.length == 0) {
      return true;
    }

    if (this.sortFields.value.length > 1) {
      return false;
    }

    return (
      this.sortFields.value[0].field.name == '' &&
      this.sortFields.value[0].direction == ''
    );
  }

  protected findIconBySortFieldName(sortFieldName: string): string {
    const field = (this.availableFields() ?? []).find(
      (field) => field.name === sortFieldName,
    );
    return field ? field.icon || '' : '';
  }
}

export function moveItemInFormArray(
  formArray: FormArray,
  fromIndex: number,
  toIndex: number,
): void {
  const dir = toIndex > fromIndex ? 1 : -1;

  const item = formArray.at(fromIndex);
  for (let i = fromIndex; i * dir < toIndex * dir; i = i + dir) {
    const current = formArray.at(i + dir);
    formArray.setControl(i, current);
  }
  formArray.setControl(toIndex, item);
}

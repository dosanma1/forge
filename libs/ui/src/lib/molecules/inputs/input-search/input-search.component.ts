import {
	AfterViewInit,
	Component,
	computed,
	input,
	model,
	OnDestroy,
} from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideCircleX, lucideSearch } from '@ng-icons/lucide';
import { ClassValue } from 'clsx';
import { NgpInput } from 'ng-primitives/input';
import { NgpSearch, NgpSearchClear } from 'ng-primitives/search';
import { ChangeFn, provideValueAccessor, TouchedFn } from 'ng-primitives/utils';
import { debounceTime, distinctUntilChanged, Subject } from 'rxjs';
import { cn } from '../../../../helpers/cn';
import { MmcIcon } from '../../../atoms/icon/icon.component';
import { MmcInput } from '../../../atoms/input/input.directive';

@Component({
	selector: 'mmc-input-search',
	hostDirectives: [NgpSearch],
	imports: [MmcIcon, MmcInput, NgpSearchClear, NgpInput],
	providers: [
		provideValueAccessor(MmcInputSearch),
		provideIcons({ lucideSearch, lucideCircleX }),
	],
	template: `
		<div class="relative">
			<div class="grid grid-cols-1">
				<input
					mmcInput
					ngpInput
					type="search"
					[value]="query()"
					[placeholder]="placeholder()"
					(input)="onQueryChange($event)"
					[class]="inputClassNames()"
				/>
				<mmc-icon
					size="sm"
					class="pointer-events-none col-start-1 row-start-1 ml-3 size-5 self-center text-muted-foreground sm:size-4"
					name="lucideSearch"
				/>
			</div>
			@if (query()) {
				<button
					class="text-muted-foreground/80 hover:text-foreground focus-visible:outline-ring/70 absolute inset-y-0 end-0 flex h-full w-9 items-center justify-center rounded-e-lg outline-offset-2 transition-colors focus:z-10 focus-visible:outline focus-visible:outline-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
					ngpSearchClear
					aria-label="Clear search"
				>
					<mmc-icon size="sm" name="lucideCircleX"> </mmc-icon>
				</button>
			}
		</div>
	`,
	host: {
		'[class]': 'classNames()',
		'(focusout)': 'onTouched?.()',
	},
})
export class MmcInputSearch
	implements ControlValueAccessor, AfterViewInit, OnDestroy {
	readonly additionalClasses = input<ClassValue>('', {
		alias: 'class',
	});

	readonly additionalInputClasses = input<ClassValue>('', {
		alias: 'inputClass',
	});

	readonly debounceTime = input<number>(0);

	protected readonly classNames = computed(() =>
		cn('', this.additionalClasses()),
	);

	protected readonly inputClassNames = computed(() =>
		cn(
			'col-start-1 row-start-1 block w-full py-1.5 pl-10 pe-9',
			this.additionalClasses(),
		),
	);
	/** The search query */
	readonly query = model<string>('');

	/** The placeholder text */
	readonly placeholder = input<string>('');

	/** The function to call when the value changes */
	private onChange?: ChangeFn<string>;

	/** The function to call when the control is touched */
	protected onTouched?: TouchedFn;

	private inputSubject = new Subject<string>();

	ngAfterViewInit() {
		this.inputSubject
			.pipe(debounceTime(this.debounceTime()), distinctUntilChanged())
			.subscribe((value) => {
				this.query.set(value);
				this.onChange?.(value);
			});
	}

	ngOnDestroy(): void {
		this.inputSubject.complete();
	}

	writeValue(value: string): void {
		this.query.set(value);
	}

	registerOnChange(fn: ChangeFn<string>): void {
		this.onChange = fn;
	}

	registerOnTouched(fn: TouchedFn): void {
		this.onTouched = fn;
	}

	protected onQueryChange(event: Event): void {
		const input = event.target as HTMLInputElement;
		this.inputSubject.next(input.value);
	}
}

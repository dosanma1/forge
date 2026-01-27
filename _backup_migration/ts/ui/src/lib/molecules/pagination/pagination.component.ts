import { Component, computed } from '@angular/core';
import { ControlValueAccessor } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import {
	lucideChevronLeft,
	lucideChevronRight,
	lucideChevronsLeft,
	lucideChevronsRight,
} from '@ng-icons/lucide';
import {
	injectPaginationState,
	NgpPagination,
	NgpPaginationButton,
	NgpPaginationFirst,
	NgpPaginationLast,
	NgpPaginationNext,
	NgpPaginationPrevious,
} from 'ng-primitives/pagination';
import { ChangeFn, provideValueAccessor, TouchedFn } from 'ng-primitives/utils';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcIcon } from '../../atoms/icon/icon.component';

@Component({
	selector: 'mmc-pagination',
	templateUrl: 'pagination.component.html',
	styleUrl: 'pagination.component.scss',
	hostDirectives: [
		{
			directive: NgpPagination,
			inputs: [
				'ngpPaginationPage:page',
				'ngpPaginationPageCount:pageCount',
				'ngpPaginationDisabled:disabled',
			],
			outputs: ['ngpPaginationPageChange:pageChange'],
		},
	],
	imports: [
		NgpPaginationButton,
		NgpPaginationFirst,
		NgpPaginationLast,
		NgpPaginationNext,
		NgpPaginationPrevious,
		MmcIcon,
		MmcButton,
	],
	providers: [
		provideValueAccessor(NgpPagination),
		provideIcons({
			lucideChevronsLeft,
			lucideChevronsRight,
			lucideChevronLeft,
			lucideChevronRight,
		}),
	],
	host: {
		class: 'contents',
		'(focusout)': 'onTouched?.()',
	},
})
export class PaginationComponent implements ControlValueAccessor {
	/** Access the pagination state */
	protected readonly state = injectPaginationState();

	/** Get the pages as an array we can iterate over */
	protected readonly pages = computed(() =>
		Array.from({ length: this.state().pageCount() }).map((_, i) => i + 1),
	);

	/** Get the pages to display with ellipsis */
	protected readonly displayPages = computed(() => {
		const currentPage = this.state().page();
		const pageCount = this.state().pageCount();
		const pages: (number | 'ellipsis')[] = [];

		if (pageCount <= 7) {
			// Show all pages if 7 or fewer
			for (let i = 1; i <= pageCount; i++) {
				pages.push(i);
			}
		} else {
			// Always show first page
			pages.push(1);

			if (currentPage > 3) {
				pages.push('ellipsis');
			}

			// Show pages around current page
			const start = Math.max(2, currentPage - 1);
			const end = Math.min(pageCount - 1, currentPage + 1);

			for (let i = start; i <= end; i++) {
				if (!pages.includes(i)) {
					pages.push(i);
				}
			}

			if (currentPage < pageCount - 2) {
				pages.push('ellipsis');
			}

			// Always show last page
			if (!pages.includes(pageCount)) {
				pages.push(pageCount);
			}
		}

		return pages;
	});

	/** The onChange callback */
	private onChange?: ChangeFn<number>;

	/** The onTouched callback */
	protected onTouched?: TouchedFn;

	constructor() {
		this.state().pageChange.subscribe((value) => this.onChange?.(value));
	}

	/** Write a new value to the control */
	writeValue(value: number): void {
		this.state().page.set(value);
	}

	/** Register a callback to be called when the value changes */
	registerOnChange(fn: ChangeFn<number>): void {
		this.onChange = fn;
	}

	/** Register a callback to be called when the control is touched */
	registerOnTouched(fn: TouchedFn): void {
		this.onTouched = fn;
	}
}

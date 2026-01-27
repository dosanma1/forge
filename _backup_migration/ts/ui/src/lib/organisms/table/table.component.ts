import { NgTemplateOutlet } from '@angular/common';
import {
	Component,
	computed,
	contentChild,
	input,
	model,
	OnInit,
	output,
	signal,
	Signal,
	TemplateRef,
} from '@angular/core';
import { NgIcon, provideIcons } from '@ng-icons/core';
import {
	lucideChevronDown,
	lucideChevronFirst,
	lucideChevronLast,
	lucideChevronLeft,
	lucideChevronRight,
	lucideChevronUp,
	lucideSettings2,
	lucideX,
} from '@ng-icons/lucide';
import {
	CellContext,
	ColumnDef,
	createAngularTable,
	getCoreRowModel,
	HeaderContext,
	injectFlexRenderContext,
	Table,
	PaginationState as TSPaginationState,
	SortingState as TSSortingState,
	VisibilityState,
} from '@tanstack/angular-table';
import { cn } from '../../../helpers/cn';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcCheckbox } from '../../atoms/checkbox/checkbox.component';
import { MmcIcon } from '../../atoms/icon/icon.component';
import { MmcLabel } from '../../atoms/label/label.directive';
import { MmcMenuItemCheckbox } from '../../atoms/menu/menu-item-checkbox.directive';
import { MmcMenuTrigger } from '../../atoms/menu/menu-trigger.directive';
import { MmcMenu } from '../../atoms/menu/menu.directive';
import { MmcInputSearch } from '../../molecules/inputs/input-search/input-search.component';
import { PaginationComponent } from '../../molecules/pagination/pagination.component';
import { OutlineComponent } from './variants/outline/outline.component';
import { PrimaryComponent } from './variants/primary/primary.component';

export type TableVariants = NonNullable<'default' | 'primary' | 'outline'>;
export interface DataSource<T> {
	data: T[];
	totalCount: number;
}

export type PaginationState = TSPaginationState;
export type SortingState = TSSortingState;
export type ColumnVisibility = VisibilityState;

@Component({
	selector: 'mmc-table',
	templateUrl: 'table.component.html',
	imports: [
		PrimaryComponent,
		OutlineComponent,
		PaginationComponent,
		MmcLabel,
		MmcCheckbox,
		MmcIcon,
		NgIcon,
		NgTemplateOutlet,
		MmcMenu,
		MmcMenuItemCheckbox,
		MmcMenuTrigger,
		MmcButton,
		MmcInputSearch,
	],
	viewProviders: [
		provideIcons({
			lucideChevronDown,
			lucideChevronFirst,
			lucideChevronLast,
			lucideChevronLeft,
			lucideChevronRight,
			lucideChevronUp,
			lucideSettings2,
			lucideX,
		}),
	],
})
export class MmcTableComponent<T> implements OnInit {
	// Inputs
	readonly variant = input<TableVariants>('default');
	readonly dataSource = input.required<DataSource<T>>();
	readonly columns = input.required<ColumnDef<T>[]>();
	readonly pagination = model<PaginationState>();
	readonly sorting = model<SortingState>();
	readonly columnVisibility = model<ColumnVisibility>({});
	readonly searchPlaceholder = input<string>('Search...');
	readonly showToolbar = input<boolean>(true);
	readonly showSearch = input<boolean>(true);
	readonly showColumnVisibility = input<boolean>(true);

	// Template refs for toolbar actions
	readonly toolbarStart = contentChild<TemplateRef<unknown>>('toolbarStart');
	readonly toolbarEnd = contentChild<TemplateRef<unknown>>('toolbarEnd');
	readonly selectionActions = contentChild<TemplateRef<{ selectedCount: number }>>('selectionActions');

	// Outputs
	readonly paginationChange = output<PaginationState>();
	readonly searchChange = output<string>();

	readonly currentPage = computed(() => this.pagination().pageIndex + 1);

	readonly pages = computed(() => {
		if (this.pagination().pageSize <= 0) {
			throw new Error('Page size must be greater than zero');
		}

		return Math.ceil(
			this.dataSource().totalCount / this.pagination().pageSize,
		);
	});

	readonly startRow = computed(() => {
		if (this.dataSource().data.length === 0) return 0;
		return this.pagination().pageIndex * this.pagination().pageSize + 1;
	});

	readonly endRow = computed(() => {
		const start = this.pagination().pageIndex * this.pagination().pageSize;
		return start + this.dataSource().data.length;
	});

	readonly selectedCount = computed(() => {
		if (!this.table) return 0;
		return Object.keys(this.table.getState().rowSelection || {}).length;
	});

	readonly showSelectionPanel = computed(() => this.selectedCount() > 0);

	searchQuery = signal('');

	table: Table<T> & Signal<Table<T>>;

	ngOnInit(): void {
		this.table = createAngularTable<T>(() => ({
			data: this.dataSource().data,
			columns: this.columns(),
			state: {
				columnVisibility: this.columnVisibility(),
			},
			onColumnVisibilityChange: (updater) => {
				const newState =
					typeof updater === 'function'
						? updater(this.columnVisibility())
						: updater;
				this.columnVisibility.set(newState);
			},
			getRowCanExpand: () => true,
			getCoreRowModel: getCoreRowModel(),
			manualPagination: true,
		}));
	}

	onPageIndexChange(page: number): void {
		this.pagination.update((state) => ({
			pageIndex: page - 1,
			pageSize: state.pageSize,
		}));

		this.paginationChange.emit(this.pagination());
	}

	onPageSizeChange(event: Event) {
		const value = (event.target as HTMLSelectElement).value;
		this.pagination.set({
			pageIndex: 0,
			pageSize: Number(value),
		});

		this.paginationChange.emit(this.pagination());
	}

	onSearchInput(event: Event) {
		const value = (event.target as HTMLInputElement).value;
		this.searchChange.emit(value);
	}

	onSearchChange(value: string) {
		this.searchQuery.set(value);
		this.searchChange.emit(value);
	}

	toggleColumnVisibility(columnId: string) {
		const column = this.table.getColumn(columnId);
		if (column) {
			column.toggleVisibility();
		}
	}

	getVisibleColumns() {
		return this.table
			.getAllColumns()
			.filter((col) => col.getCanHide() && col.id !== 'select');
	}

	clearSelection() {
		this.table.resetRowSelection();
	}

	readonly cn = cn;
}

@Component({
	imports: [MmcCheckbox],
	template: `
		<mmc-checkbox
			class="flex"
			[indeterminate]="
				(!context.table.getIsAllRowsSelected &&
					context.table.getIsAllPageRowsSelected()) ||
				context.table.getIsSomePageRowsSelected()
			"
			(checkedChange)="onCheckedChange($event)"
			aria-label="Select all"
		></mmc-checkbox>
	`,
})
export class CheckboxHeader<T> {
	context = injectFlexRenderContext<HeaderContext<T, unknown>>();

	onCheckedChange(checked: boolean) {
		this.context.table.toggleAllRowsSelected(checked);
	}
}

@Component({
	imports: [MmcCheckbox],
	template: `
		<mmc-checkbox
			class="flex"
			[checked]="context.row.getIsSelected()"
			(checkedChange)="onCheckedChange($event)"
			aria-label="Select row"
		></mmc-checkbox>
	`,
})
export class CheckboxRow<T> {
	readonly context = injectFlexRenderContext<CellContext<T, unknown>>();

	onCheckedChange(checked: boolean) {
		this.context.row.toggleSelected(checked);
	}
}

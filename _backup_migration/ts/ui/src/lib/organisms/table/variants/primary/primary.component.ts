import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FlexRenderDirective } from '@tanstack/angular-table';
import {
	MmcTable,
	MmcTableBody,
	MmcTableCell,
	MmcTableHead,
	MmcTableHeader,
	MmcTableRow,
} from '../../../../atoms/table';
import { MmcTableComponent } from '../../table.component';

@Component({
	selector: 'mmc-table-primary',
	templateUrl: './primary.component.html',
	styleUrl: './primary.component.scss',
	imports: [
		MmcTableHeader,
		MmcTableRow,
		MmcTableHead,
		FlexRenderDirective,
		MmcTableBody,
		MmcTableCell,
		MmcTable,
	],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PrimaryComponent<T> {
	protected readonly tableCmp = inject(MmcTableComponent<T>);
}

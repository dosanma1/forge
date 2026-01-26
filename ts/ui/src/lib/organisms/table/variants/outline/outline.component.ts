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
	selector: 'mmc-table-outline',
	templateUrl: './outline.component.html',
	styleUrl: './outline.component.scss',
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
export class OutlineComponent<T> {
	protected tableCmp = inject(MmcTableComponent<T>);
}

import {
	ChangeDetectionStrategy,
	Component,
	inject,
	input,
	output,
} from '@angular/core';
import { MmcBreadcrumbService } from './breadcrumb.service';
import {
	BreadcrumbLogo,
	BreadcrumbSelectorSegment,
	MmcBreadcrumbSelector,
} from './variants/selector/selector.component';
import { MmcBreadcrumbSimple } from './variants/simple/simple.component';

export interface Breadcrumb {
	label: string;
	url: string;
}

export type BreadcrumbVariant = 'simple' | 'selector';

@Component({
	selector: 'mmc-breadcrumb',
	templateUrl: './breadcrumb.component.html',
	styleUrl: './breadcrumb.component.scss',
	imports: [MmcBreadcrumbSelector, MmcBreadcrumbSimple],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcBreadcrumb {
	readonly breadcrumbService = inject(MmcBreadcrumbService);

	// Variant selection
	readonly variant = input<BreadcrumbVariant>('simple');

	// Selector variant inputs
	readonly segments = input<BreadcrumbSelectorSegment[]>([]);
	readonly logo = input<BreadcrumbLogo>();

	// Selector variant outputs
	readonly itemSelected = output<{ segmentId: string; itemId: string }>();
	readonly addClicked = output<{ segmentId: string }>();
	readonly logoClick = output<void>();
	readonly segmentClick = output<{ segmentId: string; itemId: string }>();

	onItemSelected(event: { segmentId: string; itemId: string }): void {
		this.itemSelected.emit(event);
	}

	onAddClicked(event: { segmentId: string }): void {
		this.addClicked.emit(event);
	}

	onLogoClick(): void {
		this.logoClick.emit();
	}

	onSegmentClick(event: { segmentId: string; itemId: string }): void {
		this.segmentClick.emit(event);
	}
}

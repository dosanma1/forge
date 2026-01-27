import {
	ChangeDetectionStrategy,
	Component,
	inject,
	OnInit,
} from '@angular/core';
import { BreadcrumbBuilderService } from '../../../../core/services/breadcrumb-builder.service';

@Component({
	selector: 'mmc-general',
	templateUrl: './general.component.html',
	styleUrl: './general.component.scss',
	imports: [],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GeneralComponent implements OnInit {
	private readonly breadcrumbBuilder = inject(BreadcrumbBuilderService);

	ngOnInit(): void {
		// Set breadcrumbs for general settings page
		this.breadcrumbBuilder.setBreadcrumbsForCurrentPage();
	}
}

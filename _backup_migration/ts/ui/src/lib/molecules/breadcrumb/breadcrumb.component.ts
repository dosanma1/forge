import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MmcButton } from '../../atoms/button/button.component';
import { MmcBreadcrumbService } from './breadcrumb.service';

export interface Breadcrumb {
	label: string;
	url: string;
}

@Component({
	selector: 'mmc-breadcrumb',
	templateUrl: './breadcrumb.component.html',
	styleUrl: './breadcrumb.component.scss',
	imports: [RouterLink, MmcButton],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcBreadcrumb {
	protected readonly breadcrumbService = inject(MmcBreadcrumbService);
}

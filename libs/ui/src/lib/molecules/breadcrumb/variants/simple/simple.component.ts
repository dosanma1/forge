import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MmcButton } from '../../../../atoms/button/button.component';
import { MmcBreadcrumb } from '../../breadcrumb.component';

@Component({
	selector: 'mmc-breadcrumb-simple',
	templateUrl: './simple.component.html',
	styleUrl: './simple.component.scss',
	imports: [RouterLink, MmcButton],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MmcBreadcrumbSimple {
	protected readonly breadcrumbCmp = inject(MmcBreadcrumb);
}

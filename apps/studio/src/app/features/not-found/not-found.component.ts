import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideArrowRight } from '@ng-icons/lucide';
import { MmcButton, MmcIcon } from '@forge/ui';

@Component({
	selector: 'mmc-not-found',
	templateUrl: './not-found.component.html',
	styleUrl: './not-found.component.scss',
	imports: [RouterLink, MmcButton, MmcIcon],
	viewProviders: [provideIcons({ lucideArrowRight })],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NotFoundComponent {}

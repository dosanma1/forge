import {
	ChangeDetectionStrategy,
	Component,
	computed,
	input,
} from '@angular/core';
import { cn, MmcBreadcrumb, MmcDivider } from '@forge/ui';

export type LayoutSize = NonNullable<'default' | 'lg' | 'xl' | 'full'>;

@Component({
	selector: 'mmc-settings-main-layout',
	templateUrl: './settings-main-layout.component.html',
	styleUrl: './settings-main-layout.component.scss',
	imports: [MmcDivider, MmcBreadcrumb],
	changeDetection: ChangeDetectionStrategy.OnPush,
	host: {
		class: 'h-full flex flex-col flex-auto',
	},
})
export class SettingsMainLayoutComponent {
	readonly size = input<LayoutSize>('default');

	protected sizeClass = computed(() => {
		switch (this.size()) {
			case 'lg': {
				return 'max-w-3xl';
			}
			case 'xl': {
				return 'max-w-5xl';
			}
			case 'full': {
				return 'max-w-full';
			}
			default: {
				return 'max-w-2xl';
			}
		}
	});

	readonly cn = cn;
}

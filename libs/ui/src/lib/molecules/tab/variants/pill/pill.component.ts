import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { cn } from '../../../../../helpers/cn';
import { MmcBadge } from '../../../../atoms/badge/badge.component';
import { MmcButton } from '../../../../atoms/button/button.component';
import { MmcIcon } from '../../../../atoms/icon/icon.component';
import { MmcTabs } from '../../tabs.component';

@Component({
	selector: 'mmc-tabs-pill',
	templateUrl: './pill.component.html',
	imports: [NgClass, MmcButton, MmcIcon, MmcBadge],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PillTabsComponent {
	protected readonly tabsCmp = inject(MmcTabs);
	protected readonly cn = cn;

	getTabButtonClasses(index: number): string {
		const isActive = index === this.tabsCmp.activeTabIndex();
		return cn(
			'transition-all border shadow-sm',
			isActive && 'border-border bg-secondary text-secondary-foreground',
			!isActive && 'bg-background text-muted-foreground hover:text-foreground hover:bg-accent',
		);
	}
}

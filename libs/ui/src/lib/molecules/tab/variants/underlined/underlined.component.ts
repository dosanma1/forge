import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { cn } from '../../../../../helpers/cn';
import { MmcBadge } from '../../../../atoms/badge/badge.component';
import { MmcButton } from '../../../../atoms/button/button.component';
import { MmcIcon } from '../../../../atoms/icon/icon.component';
import { MmcTabs } from '../../tabs.component';

@Component({
    selector: 'mmc-tabs-underlined',
    templateUrl: './underlined.component.html',
    imports: [MmcButton, MmcIcon, MmcBadge],
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnderlinedTabsComponent {
    protected readonly tabsCmp = inject(MmcTabs);
    protected readonly cn = cn;

    getTabButtonClasses(index: number): string {
        const isActive = index === this.tabsCmp.activeTabIndex();
        return cn(
            'transition-all px-3 py-1.5 rounded-md text-sm font-medium relative z-10', // Base classes
            isActive && 'bg-muted text-foreground', // Active state: pill background
            !isActive && 'text-muted-foreground hover:text-foreground hover:bg-muted/50', // Inactive state
        );
    }
}

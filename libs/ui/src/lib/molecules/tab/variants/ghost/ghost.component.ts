import { NgClass } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { cn } from '../../../../../helpers/cn';
import { MmcBadge } from '../../../../atoms/badge/badge.component';
import { MmcIcon } from '../../../../atoms/icon/icon.component';
import { MmcTabs } from '../../tabs.component';

@Component({
  selector: 'mmc-tabs-ghost',
  templateUrl: './ghost.component.html',
  imports: [NgClass, MmcIcon, MmcBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GhostTabsComponent {
  protected readonly tabsCmp = inject(MmcTabs);
  protected readonly cn = cn;

  getTabButtonClasses(index: number): string {
    const isActive = index === this.tabsCmp.activeTabIndex();
    return cn(
      'px-3 py-1.5 text-sm font-medium rounded-md transition-colors',
      isActive && 'bg-muted text-foreground',
      !isActive && 'text-muted-foreground hover:text-foreground hover:bg-muted/50',
    );
  }
}

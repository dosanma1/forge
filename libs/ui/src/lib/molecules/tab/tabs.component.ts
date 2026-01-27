import { animate, style, transition, trigger } from '@angular/animations';
import { NgTemplateOutlet } from '@angular/common';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChildren,
  input,
  model,
  output,
  signal,
} from '@angular/core';
import { ClassValue } from 'clsx';
import { cn } from '../../../helpers/cn';
import { MmcTab } from './tab.component';
import { PillTabsComponent } from './variants/pill/pill.component';
import { UnderlinedTabsComponent } from './variants/underlined/underlined.component';

export type TabsOrientation =
  | 'horizontal'
  | 'vertical'
  | 'horizontal-reverse'
  | 'vertical-reverse';

export type TabsVariant = 'pill' | 'underlined';

export interface TabChange {
  previous: number | undefined;
  current: number;
}

@Component({
  selector: 'mmc-tabs',
  standalone: true,
  templateUrl: './tabs.component.html',
  imports: [NgTemplateOutlet, PillTabsComponent, UnderlinedTabsComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  animations: [
    trigger('tabChange', [
      transition('* => *', [
        style({ opacity: 0 }),
        animate('150ms ease-in', style({ opacity: 1 })),
      ]),
    ]),
  ],
  host: {
    '[class]': 'classNames()',
  },
})
export class MmcTabs implements AfterContentInit {
  public readonly additionalClasses = input<ClassValue>('', {
    alias: 'class',
  });
  public readonly activeTabIndex = model<number>();
  public readonly variant = input<TabsVariant>('pill');
  public readonly orientation = input<TabsOrientation>('horizontal');
  public readonly showTabContent = model<boolean>(true);
  public readonly scrollable = input<boolean>(false);

  public readonly tabChanged = output<TabChange>();

  public readonly tabs = contentChildren(MmcTab);
  protected readonly activeTabComponent = signal<MmcTab | undefined>(undefined);

  protected readonly classNames = computed(() =>
    cn('flex w-full', this.getOrientationClass(), this.additionalClasses()),
  );

  public readonly tabListClasses = computed(() =>
    cn(
      'flex',
      this.scrollable() && 'overflow-x-auto scrollbar-thin',
      this.orientation() === 'horizontal' ? 'flex-row' : 'flex-col space-y-1',
    ),
  );

  ngAfterContentInit(): void {
    this.initActiveTab();
  }

  selectTab(index: number): void {
    const previousTabIndex = this.activeTabIndex();
    this.activeTabIndex.set(index);
    this.activeTabComponent.set(this.tabs()[index]);
    this.tabChanged.emit({ previous: previousTabIndex, current: index });
  }

  toggleShowTabContent(): void {
    this.showTabContent.set(!this.showTabContent());
  }

  private initActiveTab(): void {
    this.selectTab(this.activeTabIndex() ?? 0);
  }

  private getOrientationClass(): string {
    switch (this.orientation()) {
      case 'horizontal':
        return 'flex-col';
      case 'vertical':
        return 'flex-row';
      case 'horizontal-reverse':
        return 'flex-col-reverse';
      case 'vertical-reverse':
        return 'flex-row-reverse';
      default:
        return '';
    }
  }
}

import { ConnectionPositionPair } from '@angular/cdk/overlay';
import { NgClass } from '@angular/common';
import {
  Component,
  inject,
  input,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import {
  ActivatedRoute,
  Router,
  RouterLink,
  RouterLinkActive,
  UrlTree,
} from '@angular/router';
import { provideIcons } from '@ng-icons/core';
import { lucideChevronRight, lucideTrafficCone } from '@ng-icons/lucide';
import { NavigationItem } from '../../../../../navigation/navigation.types';
import { MmcButton } from '../../../../atoms/button/button.component';
import { MmcIcon } from '../../../../atoms/icon/icon.component';
import { MmcMenuItem } from '../../../../atoms/menu/menu-item.directive';
import { MmcMenuTrigger } from '../../../../atoms/menu/menu-trigger.directive';
import { MmcMenu } from '../../../../atoms/menu/menu.directive';
import { SideBarComponent } from '../../side-bar.component';

@Component({
  selector: 'mmc-collapsable',
  imports: [
    NgClass,
    RouterLinkActive,
    RouterLink,
    MmcButton,
    MmcIcon,
    MmcMenu,
    MmcMenuTrigger,
    MmcMenuItem,
  ],
  viewProviders: [provideIcons({ lucideChevronRight, lucideTrafficCone })],
  templateUrl: './collapsable.component.html',
  styleUrl: './collapsable.component.scss',
  host: {
    '[class.!mt-5]': 'isSideBarOpened',
  },
})
export class CollapsableComponent {
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);
  private readonly sideBarComponent = inject(SideBarComponent);

  public readonly templateRef = viewChild(TemplateRef);
  public readonly item = input<NavigationItem>();

  protected readonly isOpen = signal<boolean>(true);

  get isSideBarOpened(): boolean {
    return this.sideBarComponent.isOpened;
  }

  protected open(): void {
    this.isOpen.set(!this.isOpen());
  }

  protected canShowChildrens(): boolean {
    return this.sideBarComponent.isOpened && this.isOpen();
  }

  protected menuPosition(): ConnectionPositionPair[] {
    return [
      new ConnectionPositionPair(
        { originX: 'end', originY: 'top' },
        { overlayX: 'start', overlayY: 'top' },
      ),
    ];
  }

  routerLink(link: string | undefined, regexp: RegExp | undefined): UrlTree {
    const currentURL = this.router.routerState.snapshot.url;
    const match = regexp ? currentURL.match(regexp) : null;

    if (match && match[1]) {
      return this.router.createUrlTree([(link || '') + match[1]]);
    }

    return this.router.createUrlTree([link || '']);
  }
}

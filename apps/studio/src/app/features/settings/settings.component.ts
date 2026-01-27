import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
} from '@angular/core';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { MenuRoute, Path } from '../../core/navigation/navigation-menu';
import { provideIcons } from '@ng-icons/core';
import {
  lucideBell,
  lucideBoxes,
  lucideBuilding,
  lucideBuilding2,
  lucideChevronLeft,
  lucideCircleHelp,
  lucideCircleUserRound,
  lucideCode,
  lucideContact,
  lucideCreditCard,
  lucideSlidersHorizontal,
  lucideTrafficCone,
  lucideUnplug,
  lucideUsersRound,
} from '@ng-icons/lucide';
import {
  MmcButton,
  MmcIcon,
  NavigationItem,
  SideBarComponent,
} from '@forge/ui';

@Component({
  selector: 'mmc-settings',
  standalone: true,
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  imports: [RouterLink, RouterOutlet, MmcIcon, MmcButton, SideBarComponent],
  viewProviders: [
    provideIcons({
      lucideChevronLeft,
      lucideTrafficCone,
      lucideCircleUserRound,
      lucideSlidersHorizontal,
      lucideBell,
      lucideBuilding,
      lucideContact,
      lucideBuilding2,
      lucideUsersRound,
      lucideCode,
      lucideBoxes,
      lucideCreditCard,
      lucideCircleHelp,
      lucideUnplug,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SettingsComponent implements OnInit {
  private router = inject(Router);

  private previousURL: string;

  protected back(): string {
    return this.previousURL ?? '/';
  }

  public ngOnInit(): void {
    // TODO: Get previous URL
    // this.router.events
    // 	.pipe
    // 	// filter((evt: any) => evt instanceof RoutesRecognized),
    // 	// pairwise(),
    // 	()
    // 	.subscribe((events: any) => {
    // 		console.log(events);
    // 		// this.previousURL = events[0].urlAfterRedirects;
    // 		// console.log('previous url', this.previousUrl);
    // 	});
  }

  protected navigationItems: NavigationItem[] = [
    {
      id: 'account',
      title: 'Account',
      type: 'group',
      children: [
        // {
        // 	id: 'profile',
        // 	title: 'Profile',
        // 	type: 'basic',
        // 	icon: 'lucideCircleUserRound',
        // 	link: `${this.accountSettingsPath()}/${Path.PROFILE}`,
        // },
        {
          id: 'preferences',
          title: 'Preferences',
          type: 'basic',
          icon: 'lucideSlidersHorizontal',
          link: `${this.accountSettingsPath()}/${Path.PREFERENCES}`,
        },
      ],
    },
    {
      id: 'organisation',
      title: 'Organisation',
      type: 'group',
      children: [
        {
          id: 'general',
          title: 'General',
          type: 'basic',
          icon: 'lucideBuilding',
          link: `${this.projectSettingsPath()}/${Path.GENERAL}`,
        },
        {
          id: 'general',
          title: 'General',
          type: 'basic',
          icon: 'lucideBuilding',
          link: `${this.projectSettingsPath()}/${Path.GENERAL}`,
        },
      ],
    },
  ];

  private accountSettingsPath(): string {
    return `${MenuRoute.SETTINGS}/${Path.ACCOUNTS}`;
  }

  private projectSettingsPath(): string {
    return `${MenuRoute.SETTINGS}/${Path.PROJECT}`;
  }
}

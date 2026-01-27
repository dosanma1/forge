import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { Router } from '@angular/router';
import { IProject } from '../../../models/project.model';
import { MenuRoute, Path } from '../../../navigation/navigation-menu';
import {
  MmcAvatar,
  MmcAvatarFallback,
  MmcAvatarImage,
  MmcIcon,
  MmcMenu,
  MmcMenuItem,
  MmcMenuTrigger,
} from '@forge/ui';

enum SidebarMenuAction {
  SETTINGS,
  DOWNLOAD_DESKTOP_APP,
  SWITCH_WORKSPACE,
  VIEW_ALL_WORKSPACES,
  CREATE_OR_JOIN_WORKSPACE,
  PAUSE_NOTIFICATIONS,
  NOTIFICATION_SCHEDULE,
  SIGN_OUT,
}

enum PauseNotificationsTimeFrame {
  THIRTY_MINUTES = 'For 30 minutes',
  ONE_HOUR = 'For 1 hour',
  TWO_HOURS = 'For 2 hours',
  UNTILL_TOMORROW = 'Until tomorrow',
  UNTILL_NEXT_WEEK = 'Until next week',
  CUSTOM = 'Custom',
}

@Component({
  selector: 'mmc-side-bar-menu',
  standalone: true,
  templateUrl: './side-bar-menu.component.html',
  imports: [
    MmcMenu,
    MmcMenuTrigger,
    MmcMenuItem,
    MmcIcon,
    MmcAvatar,
    MmcAvatarFallback,
    MmcAvatarImage,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SideBarMenuComponent {
  private readonly router = inject(Router);

  public readonly templateRef = viewChild(TemplateRef);
  public readonly activeWorkspace = input.required<IProject>();
  public readonly workspaces = input.required<IProject[]>();
  public readonly isSidebarOpened = input.required<boolean>();

  public readonly switchWorkspace = output<string>();

  protected readonly eAction: typeof SidebarMenuAction = SidebarMenuAction;

  protected readonly pauseNotificationsTimeFrame: typeof PauseNotificationsTimeFrame =
    PauseNotificationsTimeFrame;
  protected readonly pauseNotificationsTimeFrameKeys = Object.keys(
    PauseNotificationsTimeFrame,
  ) as Array<keyof typeof PauseNotificationsTimeFrame>;

  /**
   * Returns a sorted array of workspaces with the active workspace first,
   * followed by up to 4 other workspaces, for a maximum of 5 total workspaces
   */
  protected sortedWorkspaces(): IProject[] {
    const allWorkspaces = this.workspaces();
    const activeWorkspaceId = this.activeWorkspace().ID();

    // If there are no workspaces or only one workspace, return the array as is
    if (allWorkspaces.length <= 1) {
      return allWorkspaces;
    }

    // Find the active workspace
    const activeWorkspace = allWorkspaces.find(
      (w) => w.ID() === activeWorkspaceId,
    );

    // Get all other workspaces
    const otherWorkspaces = allWorkspaces.filter(
      (w) => w.ID() !== activeWorkspaceId,
    );

    // Return the active workspace first, followed by up to 4 other workspaces
    return [activeWorkspace, ...otherWorkspaces].filter(Boolean).slice(0, 5);
  }

  protected onActionClick(action: SidebarMenuAction, ...args: any[]): void {
    switch (action) {
      case SidebarMenuAction.SETTINGS:
        this.router.navigate([MenuRoute.SETTINGS, Path.ACCOUNTS]);
        break;
      case SidebarMenuAction.DOWNLOAD_DESKTOP_APP:
        // TODO: Navigate to download desktop app page
        break;
      case SidebarMenuAction.SWITCH_WORKSPACE:
        this.switchWorkspace.emit(args[0]);
        break;
      case SidebarMenuAction.VIEW_ALL_WORKSPACES:
        this.router.navigate([MenuRoute.PROJECTS]);
        break;
      case SidebarMenuAction.CREATE_OR_JOIN_WORKSPACE:
        this.router.navigate([MenuRoute.JOIN]);
        break;
      case SidebarMenuAction.PAUSE_NOTIFICATIONS:
        break;
      case SidebarMenuAction.NOTIFICATION_SCHEDULE:
        break;
    }
  }
}

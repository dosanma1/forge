import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ProjectService } from '../../features/project/project.service';
import { provideIcons } from '@ng-icons/core';
import {
  lucideDatabase,
  lucideGitBranch,
  lucideHouse,
  lucideZap,
} from '@ng-icons/lucide';
import {
  BreadcrumbLogo,
  BreadcrumbSelectorSegment,
  MmcBreadcrumb,
  NavigationItem,
  SideBarComponent,
  SideBarService,
} from '@forge/ui';
import { MenuRoute } from '../navigation/navigation-menu';

@Component({
  selector: 'mmc-layout',
  standalone: true,
  imports: [RouterOutlet, SideBarComponent, MmcBreadcrumb],
  viewProviders: [
    provideIcons({
      lucideHouse,
      lucideDatabase,
      lucideGitBranch,
      lucideZap,
    }),
  ],
  templateUrl: './layout.component.html',
  styleUrl: './layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LayoutComponent {
  protected readonly projectService = inject(ProjectService);
  protected readonly sidebarService = inject(SideBarService);
  private readonly router = inject(Router);

  protected readonly logo: BreadcrumbLogo = {
    icon: 'lucideZap',
    alt: 'Home',
  };

  protected breadcrumbSegments = computed<BreadcrumbSelectorSegment[]>(() => {
    const projects = this.projectService.projects();
    const selectedProject = this.projectService.selectedResource();

    return [
      {
        id: 'project',
        label: 'Project',
        selectedId: selectedProject?.ID(),
        showAddButton: true,
        addButtonLabel: 'New project',
        items: projects.map((p) => ({
          id: p.ID(),
          label: p.name,
          icon: 'lucideDatabase',
        })),
      },
      {
        id: 'branch',
        label: 'Branch',
        selectedId: 'main',
        items: [{ id: 'main', label: 'main', icon: 'lucideGitBranch' }],
      },
    ];
  });

  onBreadcrumbSelect(event: { segmentId: string; itemId: string }): void {
    if (event.segmentId === 'project') {
      const project = this.projectService.getProjectByPath(event.itemId);
      if (project) {
        this.projectService.switchProject(project);
      }
    }
  }

  onBreadcrumbAdd(event: { segmentId: string }): void {
    if (event.segmentId === 'project') {
      // Navigate to new project page or open dialog
      console.log('Add new project clicked');
    }
  }

  onLogoClick(): void {
    this.router.navigate(['/projects']);
  }

  onSegmentClick(event: { segmentId: string; itemId: string }): void {
    if (event.segmentId === 'project') {
      // Navigate to current project dashboard
      this.router.navigate([MenuRoute.DASHBOARD]);
    }
    // Branch clicks could navigate to branch view in the future
  }

  protected navigationItems = computed<NavigationItem[]>(() => {
    return [
      {
        id: 'dashboard',
        title: 'Dashboard',
        type: 'basic',
        icon: 'lucideHouse',
        link: MenuRoute.DASHBOARD,
      },
    ];
  });
}

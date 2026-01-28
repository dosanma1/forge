import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
} from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { ProjectService } from '../../features/project/project.service';
import { provideIcons } from '@ng-icons/core';
import {
  lucideBoxes,
  lucideDatabase,
  lucideFlaskConical,
  lucideGitBranch,
  lucideHouse,
  lucideZap,
} from '@ng-icons/lucide';
import {
  BreadcrumbLogo,
  BreadcrumbSelectorSegment,
  MmcBreadcrumb,
  MmcIcon,
  NavigationItem,
  SideBarComponent,
  SideBarService,
} from '@forge/ui';
import { MenuRoute } from '../navigation/navigation-menu';

@Component({
  selector: 'mmc-layout',
  standalone: true,
  imports: [RouterOutlet, SideBarComponent, MmcBreadcrumb, MmcIcon],
  viewProviders: [
    provideIcons({
      lucideBoxes,
      lucideFlaskConical,
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
export class LayoutComponent implements OnInit {
  protected readonly projectService = inject(ProjectService);
  protected readonly sidebarService = inject(SideBarService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  ngOnInit(): void {
    // Load projects and restore last opened project
    this.projectService.list();

    // Refresh git branch when window regains focus (detects external branch changes)
    const onFocus = () => this.projectService.refreshGitBranch();
    window.addEventListener('focus', onFocus);
    this.destroyRef.onDestroy(() => window.removeEventListener('focus', onFocus));
  }

  protected readonly logo: BreadcrumbLogo = {
    icon: 'lucideZap',
    alt: 'Home',
  };

  protected readonly currentBranch = computed(() => this.projectService.currentBranch());

  protected breadcrumbSegments = computed<BreadcrumbSelectorSegment[]>(() => {
    const projects = this.projectService.projects();
    const selectedProject = this.projectService.selectedResource();
    const currentBranch = this.projectService.currentBranch() || 'main';
    const availableBranches = this.projectService.availableBranches();

    // Use available branches if loaded, otherwise just show current branch
    const branchItems = availableBranches.length > 0
      ? availableBranches.map((b) => ({ id: b, label: b, icon: 'lucideGitBranch' }))
      : [{ id: currentBranch, label: currentBranch, icon: 'lucideGitBranch' }];

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
        selectedId: currentBranch,
        items: branchItems,
      },
    ];
  });

  onBreadcrumbSelect(event: { segmentId: string; itemId: string }): void {
    if (event.segmentId === 'project') {
      const project = this.projectService.getProjectByPath(event.itemId);
      if (project) {
        this.projectService.switchProject(project);
      }
    } else if (event.segmentId === 'branch') {
      this.projectService.switchGitBranch(event.itemId);
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
      // Navigate to current project architecture view
      this.router.navigate([MenuRoute.ARCHITECTURE]);
    }
    // Branch clicks could navigate to branch view in the future
  }

  protected navigationItems = computed<NavigationItem[]>(() => {
    return [
      {
        id: 'architecture',
        title: 'Architecture',
        type: 'basic',
        icon: 'lucideBoxes',
        link: MenuRoute.ARCHITECTURE,
      },
      {
        id: 'vflow-test',
        title: 'VFlow Test',
        type: 'basic',
        icon: 'lucideFlaskConical',
        link: MenuRoute.VFLOW_TEST,
      },
    ];
  });
}

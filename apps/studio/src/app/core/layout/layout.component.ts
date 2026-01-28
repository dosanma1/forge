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
    const isGitRepo = this.projectService.isGitRepo();
    const currentBranch = this.projectService.currentBranch();
    const availableBranches = this.projectService.availableBranches();

    const segments: BreadcrumbSelectorSegment[] = [
      {
        id: 'project',
        label: 'Project',
        selectedId: selectedProject?.ID(),
        showAddButton: true,
        addButtonLabel: 'Open folder',
        items: projects.map((p) => ({
          id: p.ID(),
          label: p.name,
          icon: 'lucideDatabase',
        })),
      },
    ];

    // Always show branch segment - show "no branch" for non-git repos or repos without commits
    const hasBranch = !!currentBranch;
    const branchItems = hasBranch
      ? (availableBranches.length > 0
          ? availableBranches.map((b) => ({ id: b, label: b, icon: 'lucideGitBranch' }))
          : [{ id: currentBranch, label: currentBranch, icon: 'lucideGitBranch' }])
      : [{ id: 'no-branch', label: 'no branch', icon: 'lucideGitBranch' }];

    segments.push({
      id: 'branch',
      label: 'Branch',
      selectedId: hasBranch ? currentBranch : 'no-branch',
      showAddButton: true,
      addButtonLabel: isGitRepo ? 'New branch' : 'Initialize repository',
      items: branchItems,
    });

    return segments;
  });

  onBreadcrumbSelect(event: { segmentId: string; itemId: string }): void {
    if (event.segmentId === 'project') {
      const project = this.projectService.getProjectByPath(event.itemId);
      if (project) {
        this.projectService.switchProject(project);
      }
    } else if (event.segmentId === 'branch') {
      // Don't switch if "no branch" is selected
      if (event.itemId !== 'no-branch') {
        this.projectService.switchGitBranch(event.itemId);
      }
    }
  }

  onBreadcrumbAdd(event: { segmentId: string }): void {
    if (event.segmentId === 'project') {
      // Use the smart open folder flow
      this.projectService.openOrCreateProject();
    } else if (event.segmentId === 'branch') {
      if (this.projectService.isGitRepo()) {
        // Git repo exists - prompt for new branch name
        this.promptForNewBranch();
      } else {
        // No git repo - initialize it
        this.projectService.initGitRepo();
      }
    }
  }

  private promptForNewBranch(): void {
    const branchName = window.prompt('Enter new branch name:');
    if (branchName && branchName.trim()) {
      this.projectService.createGitBranch(branchName.trim());
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
    ];
  });
}

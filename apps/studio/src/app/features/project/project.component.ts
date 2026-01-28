import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { IProject } from '../../core/models/project.model';
import { provideIcons } from '@ng-icons/core';
import {
  lucideBuilding2,
  lucideFolderOpen,
  lucidePlay,
  lucidePlus,
  lucideTrash2,
} from '@ng-icons/lucide';
import {
  CellContext,
  ColumnDef,
  flexRenderComponent,
  injectFlexRenderContext,
} from '@tanstack/angular-table';
import {
  DataSource,
  MmcAvatar,
  MmcAvatarFallback,
  MmcAvatarImage,
  MmcButton,
  MmcConfirmationDialogService,
  MmcIcon,
  MmcTableComponent,
  PaginationState,
} from '@forge/ui';
import { ProjectService } from './project.service';

@Component({
  selector: 'tb-project',
  standalone: true,
  templateUrl: './project.component.html',
  styleUrl: './project.component.scss',
  imports: [MmcTableComponent, MmcButton, MmcIcon],
  providers: [
    provideIcons({
      plus: lucidePlus,
      folderOpen: lucideFolderOpen,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProjectComponent {
  protected readonly projectService = inject(ProjectService);

  ngOnInit(): void {
    this.projectService.list();
  }

  async openFolder(): Promise<void> {
    // Use the smart open folder flow - checks for forge.json and routes accordingly
    await this.projectService.openOrCreateProject();
  }

  // -----------------------------------------------------------------------------------------------------
  // @ Projects - Datatable
  // -----------------------------------------------------------------------------------------------------

  protected readonly initialPagination: PaginationState = {
    pageIndex: 0,
    pageSize: 10,
  };
  readonly projectsDatatable = viewChild<MmcTableComponent<IProject>>(
    'projectsDatatable',
  );

  protected readonly columns = signal<ColumnDef<IProject>[]>([
    {
      id: 'avatar',
      cell: () => flexRenderComponent(AvatarRow),
      size: 35,
    },
    {
      header: 'Name',
      cell: ({ row }) => row.original.name,
    },
    {
      header: 'Description',
      cell: ({ row }) => row.original.description,
    },
    {
      id: 'actions',
      cell: () => flexRenderComponent(ActionsRow),
    },
  ]);

  protected readonly projectsDataSource = computed<DataSource<IProject>>(() => ({
    data: this.projectService.projects(),
    totalCount: this.projectService.projects().length,
  }));
}

@Component({
  imports: [MmcAvatar, MmcAvatarFallback, MmcAvatarImage, MmcIcon],
  viewProviders: [provideIcons({ lucideBuilding2 })],
  template: `
    <mmc-avatar class="mx-2 size-4">
      @if (context.row.original.imageURL) {
        <mmc-avatar-image
          [src]="context.row.original.imageURL"
          [imgAlt]="context.row.original.name"
        />
      }
      <mmc-avatar-fallback class="bg-transparent">
        <mmc-icon size="sm" name="lucideBuilding2"></mmc-icon>
      </mmc-avatar-fallback>
    </mmc-avatar>
  `,
})
export class AvatarRow {
  readonly context =
    injectFlexRenderContext<CellContext<IProject, unknown>>();
}

@Component({
  imports: [MmcButton, MmcIcon],
  viewProviders: [provideIcons({ lucidePlay, lucideTrash2 })],
  template: `
    <div class="flex justify-end gap-1">
      <button
        mmcButton
        variant="ghost"
        size="icon"
        (click)="onSelectProject(context.row.original)"
      >
        <mmc-icon
          aria-label="Select Project"
          name="lucidePlay"
          size="sm"
        ></mmc-icon>
      </button>
      <button
        mmcButton
        variant="ghost"
        size="icon"
        (click)="onRemoveProject($event, context.row.original)"
      >
        <mmc-icon
          aria-label="Remove Project"
          name="lucideTrash2"
          size="sm"
          class="text-destructive"
        ></mmc-icon>
      </button>
    </div>
  `,
})
export class ActionsRow {
  readonly context =
    injectFlexRenderContext<CellContext<IProject, unknown>>();
  private readonly projectService = inject(ProjectService);
  private readonly confirmationDialog = inject(MmcConfirmationDialogService);

  protected onSelectProject(project: IProject): void {
    // Use switchProject to also save the project ID to localStorage
    this.projectService.switchProject(project);
  }

  protected onRemoveProject(event: Event, project: IProject): void {
    event.stopPropagation();

    const dialogRef = this.confirmationDialog.confirm({
      title: 'Delete Project',
      description: `Are you sure you want to delete "${project.name}"? The folder will be moved to Trash.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      variant: 'destructive',
    });

    dialogRef.closed.subscribe((confirmed) => {
      if (confirmed) {
        this.projectService.deleteProject(project);
      }
    });
  }
}

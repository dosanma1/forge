import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  effect,
  inject,
  input,
  OnInit,
  output,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';
import { provideIcons } from '@ng-icons/core';
import {
  lucideChevronDown,
  lucideChevronRight,
  lucideFile,
  lucideFileCode,
  lucideFileJson,
  lucideFileText,
  lucideFolder,
  lucideFolderOpen,
  lucideImage,
  lucideRefreshCw,
} from '@ng-icons/lucide';
import { MmcButton, MmcIcon, MmcTree, TreeNode } from '@forge/ui';
import {
  FileSystemEntry,
  FileSystemService,
} from '../../../core/services/file-system.service';

export interface FileTreeNode extends TreeNode {
  path: string;
  handle?: FileSystemHandle;
  type: 'file' | 'directory';
}

@Component({
  selector: 'app-file-tree',
  standalone: true,
  imports: [MmcTree, MmcButton, MmcIcon],
  viewProviders: [
    provideIcons({
      lucideFolder,
      lucideFolderOpen,
      lucideFile,
      lucideFileCode,
      lucideFileJson,
      lucideFileText,
      lucideImage,
      lucideChevronRight,
      lucideChevronDown,
      lucideRefreshCw,
    }),
  ],
  template: `
    <div class="flex flex-col h-full">
      <div class="flex items-center justify-between px-2 py-1 border-b border-border">
        <span class="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Explorer
        </span>
        <div class="flex items-center gap-1">
          @if (hotReloadEnabled()) {
            <span class="text-xs text-muted-foreground">Auto-refresh</span>
          }
          <button
            mmcButton
            variant="ghost"
            size="icon"
            class="size-6"
            (click)="refresh()"
            [disabled]="isLoading()"
            title="Refresh file tree"
          >
            <mmc-icon
              name="lucideRefreshCw"
              size="xs"
              [class.animate-spin]="isLoading()"
            />
          </button>
        </div>
      </div>

      <div class="flex-1 overflow-auto p-2">
        @if (isLoading() && treeData().length === 0) {
          <div class="flex items-center justify-center h-full">
            <span class="text-sm text-muted-foreground">Loading...</span>
          </div>
        } @else if (treeData().length === 0) {
          <div class="flex items-center justify-center h-full">
            <span class="text-sm text-muted-foreground">No files found</span>
          </div>
        } @else {
          <mmc-tree-view
            [data]="treeData()"
            [selectedNodeId]="selectedNodeId()"
            (nodeClick)="onNodeClick($event)"
          />
        }
      </div>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTreeComponent implements OnInit {
  private readonly fileSystemService = inject(FileSystemService);
  private readonly destroyRef = inject(DestroyRef);

  readonly directoryHandle = input<FileSystemDirectoryHandle | null>(null);
  readonly hotReloadEnabled = input<boolean>(true);
  readonly hotReloadInterval = input<number>(3000); // 3 seconds default

  readonly fileSelect = output<FileTreeNode>();
  readonly directorySelect = output<FileTreeNode>();

  protected readonly isLoading = signal(false);
  protected readonly selectedNodeId = signal<string | undefined>(undefined);
  protected readonly fileEntries = signal<FileSystemEntry[]>([]);

  protected readonly treeData = computed<FileTreeNode[]>(() => {
    return this.flattenEntries(this.fileEntries(), 0);
  });

  constructor() {
    // Watch for directory handle changes
    effect(() => {
      const handle = this.directoryHandle();
      if (handle) {
        this.loadDirectory(handle);
      }
    });
  }

  ngOnInit(): void {
    // Set up hot reload polling if enabled
    if (this.hotReloadEnabled()) {
      interval(this.hotReloadInterval())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          const handle = this.directoryHandle();
          if (handle && !this.isLoading()) {
            this.loadDirectory(handle, true);
          }
        });
    }
  }

  async refresh(): Promise<void> {
    const handle = this.directoryHandle();
    if (handle) {
      await this.loadDirectory(handle);
    }
  }

  private async loadDirectory(
    handle: FileSystemDirectoryHandle,
    silent: boolean = false,
  ): Promise<void> {
    if (!silent) {
      this.isLoading.set(true);
    }

    try {
      const entries = await this.fileSystemService.readDirectoryTree(
        handle,
        '',
        5, // Max depth of 5 levels
      );
      this.fileEntries.set(entries);
    } catch (error) {
      console.error('Error loading directory:', error);
    } finally {
      if (!silent) {
        this.isLoading.set(false);
      }
    }
  }

  private flattenEntries(entries: FileSystemEntry[], level: number): FileTreeNode[] {
    const nodes: FileTreeNode[] = [];

    for (const entry of entries) {
      const node: FileTreeNode = {
        name: entry.name,
        path: entry.path,
        level,
        type: entry.type,
        expandable: entry.type === 'directory',
        isExpanded: level === 0, // Auto-expand root level
        icon: this.getIcon(entry),
        expandedIcon: entry.type === 'directory' ? 'lucideFolderOpen' : undefined,
        id: entry.path,
        handle: entry.handle,
      };

      nodes.push(node);

      // Recursively add children
      if (entry.children && entry.children.length > 0) {
        nodes.push(...this.flattenEntries(entry.children, level + 1));
      }
    }

    return nodes;
  }

  private getIcon(entry: FileSystemEntry): string {
    if (entry.type === 'directory') {
      return 'lucideFolder';
    }

    // Determine file icon based on extension
    const extension = entry.name.split('.').pop()?.toLowerCase();

    switch (extension) {
      case 'ts':
      case 'tsx':
      case 'js':
      case 'jsx':
      case 'py':
      case 'go':
      case 'rs':
      case 'java':
      case 'c':
      case 'cpp':
      case 'h':
      case 'hpp':
        return 'lucideFileCode';
      case 'json':
        return 'lucideFileJson';
      case 'md':
      case 'txt':
      case 'rtf':
        return 'lucideFileText';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif':
      case 'svg':
      case 'webp':
        return 'lucideImage';
      default:
        return 'lucideFile';
    }
  }

  protected onNodeClick(node: TreeNode): void {
    const fileNode = node as FileTreeNode;
    this.selectedNodeId.set(fileNode.id);

    if (fileNode.type === 'file') {
      this.fileSelect.emit(fileNode);
    } else {
      this.directorySelect.emit(fileNode);
    }
  }
}

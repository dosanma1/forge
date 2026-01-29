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
import * as WailsProject from '../../../../wailsjs/github.com/dosanma1/forge/apps/studio/projectservice';
import { FileInfo } from '../../../../wailsjs/github.com/dosanma1/forge/apps/studio/models';

export interface FileSystemEntry {
  name: string;
  path: string;
  type: 'file' | 'directory';
  children?: FileSystemEntry[];
}

export interface FileTreeNode extends TreeNode {
  path: string;
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
  templateUrl: './file-tree.component.html',
  styleUrl: './file-tree.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FileTreeComponent implements OnInit {
  private readonly destroyRef = inject(DestroyRef);

  readonly directoryPath = input<string | null>(null);
  readonly hotReloadEnabled = input<boolean>(false); // Disabled by default - too disruptive
  readonly hotReloadInterval = input<number>(10000); // 10 seconds if enabled

  // Track expanded nodes to preserve state across refreshes
  private readonly expandedNodeIds = signal<Set<string>>(new Set());

  readonly fileSelect = output<FileTreeNode>();
  readonly directorySelect = output<FileTreeNode>();

  protected readonly isLoading = signal(false);
  protected readonly selectedNodeId = signal<string | undefined>(undefined);
  protected readonly fileEntries = signal<FileSystemEntry[]>([]);

  protected readonly treeData = computed<FileTreeNode[]>(() => {
    return this.flattenEntries(this.fileEntries(), 0);
  });

  constructor() {
    // Watch for directory path changes
    effect(() => {
      const path = this.directoryPath();
      if (path) {
        this.loadDirectory(path);
      }
    });
  }

  ngOnInit(): void {
    // Set up hot reload polling if enabled
    if (this.hotReloadEnabled()) {
      interval(this.hotReloadInterval())
        .pipe(takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          const path = this.directoryPath();
          if (path && !this.isLoading()) {
            this.loadDirectory(path, true);
          }
        });
    }
  }

  async refresh(): Promise<void> {
    const path = this.directoryPath();
    if (path) {
      await this.loadDirectory(path);
    }
  }

  private async loadDirectory(
    path: string,
    silent: boolean = false,
  ): Promise<void> {
    if (!silent) {
      this.isLoading.set(true);
    }

    try {
      const entries = await this.readDirectoryTree(path, '', 2);
      this.fileEntries.set(entries);
    } catch (error) {
      console.error('Error loading directory:', error);
    } finally {
      if (!silent) {
        this.isLoading.set(false);
      }
    }
  }

  private async readDirectoryTree(
    basePath: string,
    relativePath: string,
    maxDepth: number,
  ): Promise<FileSystemEntry[]> {
    if (maxDepth <= 0) {
      return this.readDirectory(basePath, relativePath);
    }

    const entries = await this.readDirectory(basePath, relativePath);

    for (const entry of entries) {
      if (entry.type === 'directory') {
        entry.children = await this.readDirectoryTree(
          basePath,
          entry.path,
          maxDepth - 1,
        );
      }
    }

    return entries;
  }

  private async readDirectory(
    basePath: string,
    relativePath: string,
  ): Promise<FileSystemEntry[]> {
    const fullPath = relativePath ? `${basePath}/${relativePath}` : basePath;
    const files: FileInfo[] = await WailsProject.ListDirectory(fullPath);

    return files
      .map((f) => ({
        name: f.name,
        path: relativePath ? `${relativePath}/${f.name}` : f.name,
        type: f.isDir ? ('directory' as const) : ('file' as const),
      }))
      .sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'directory' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });
  }

  private flattenEntries(entries: FileSystemEntry[], level: number): FileTreeNode[] {
    const nodes: FileTreeNode[] = [];
    const expandedIds = this.expandedNodeIds();

    for (const entry of entries) {
      // Preserve expanded state, or auto-expand root level on first load
      const isExpanded = expandedIds.has(entry.path) || (level === 0 && expandedIds.size === 0);

      const node: FileTreeNode = {
        name: entry.name,
        path: entry.path,
        level,
        type: entry.type,
        expandable: entry.type === 'directory',
        isExpanded,
        icon: this.getIcon(entry),
        expandedIcon: entry.type === 'directory' ? 'lucideFolderOpen' : undefined,
        id: entry.path,
      };

      nodes.push(node);

      // Only add children if this node is expanded
      if (entry.children && entry.children.length > 0 && isExpanded) {
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
      // Toggle expanded state for directories
      this.toggleExpanded(fileNode.path);
      this.directorySelect.emit(fileNode);
    }
  }

  private toggleExpanded(path: string): void {
    const expandedIds = new Set(this.expandedNodeIds());
    if (expandedIds.has(path)) {
      expandedIds.delete(path);
    } else {
      expandedIds.add(path);
    }
    this.expandedNodeIds.set(expandedIds);
  }
}

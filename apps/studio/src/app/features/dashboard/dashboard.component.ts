import { Component, inject, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideFolderOpen, lucideZap } from '@ng-icons/lucide';
import { MmcButton, MmcIcon } from '@forge/ui';
import { FileSystemService } from '../../core/services/file-system.service';
import {
  FileTreeComponent,
  FileTreeNode,
} from '../../shared/components/file-tree/file-tree.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [FileTreeComponent, MmcButton, MmcIcon],
  viewProviders: [
    provideIcons({
      lucideFolderOpen,
      lucideZap,
    }),
  ],
  template: `
    <div class="flex h-full">
      <!-- File Tree Panel -->
      <aside class="w-64 border-r border-border bg-sidebar flex flex-col">
        @if (directoryHandle()) {
          <app-file-tree
            [directoryHandle]="directoryHandle()"
            [hotReloadEnabled]="true"
            [hotReloadInterval]="3000"
            (fileSelect)="onFileSelect($event)"
            (directorySelect)="onDirectorySelect($event)"
            class="flex-1"
          />
        } @else {
          <div class="flex flex-col items-center justify-center h-full p-4 text-center">
            <mmc-icon name="lucideFolderOpen" class="size-12 text-muted-foreground mb-4" />
            <p class="text-sm text-muted-foreground mb-4">
              Open a folder to start working with your project files.
            </p>
            <button
              mmcButton
              variant="outline"
              (click)="openFolder()"
              class="flex items-center gap-2"
            >
              <mmc-icon name="lucideFolderOpen" size="sm" />
              Open Folder
            </button>
          </div>
        }
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-auto">
        @if (selectedFile()) {
          <div class="p-6">
            <h2 class="text-lg font-semibold mb-2">{{ selectedFile()?.name }}</h2>
            <p class="text-sm text-muted-foreground mb-4">{{ selectedFile()?.path }}</p>
            @if (fileContent()) {
              <pre class="bg-muted p-4 rounded-lg overflow-auto text-sm font-mono">{{ fileContent() }}</pre>
            }
          </div>
        } @else {
          <div class="flex flex-col items-center justify-center h-full">
            <mmc-icon name="lucideZap" class="size-16 text-muted-foreground mb-4" />
            <h1 class="text-2xl font-bold">Forge Studio</h1>
            <p class="mt-2 text-muted-foreground">
              @if (directoryHandle()) {
                Select a file from the explorer to view its contents.
              } @else {
                Open a folder to get started.
              }
            </p>
          </div>
        }
      </main>
    </div>
  `,
  host: {
    class: 'flex flex-col h-full',
  },
})
export class DashboardComponent {
  private readonly fileSystemService = inject(FileSystemService);

  protected readonly directoryHandle = signal<FileSystemDirectoryHandle | null>(null);
  protected readonly selectedFile = signal<FileTreeNode | null>(null);
  protected readonly fileContent = signal<string | null>(null);

  async openFolder(): Promise<void> {
    try {
      const handle = await this.fileSystemService.openDirectory();
      if (handle) {
        this.directoryHandle.set(handle);
        this.selectedFile.set(null);
        this.fileContent.set(null);
      }
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  }

  async onFileSelect(node: FileTreeNode): Promise<void> {
    this.selectedFile.set(node);

    // Try to read the file content
    if (node.handle && node.handle.kind === 'file') {
      try {
        const content = await this.fileSystemService.readFile(
          node.handle as FileSystemFileHandle,
        );
        this.fileContent.set(content);
      } catch (error) {
        console.error('Error reading file:', error);
        this.fileContent.set('Error reading file content');
      }
    }
  }

  onDirectorySelect(node: FileTreeNode): void {
    // For now, just select the directory
    this.selectedFile.set(node);
    this.fileContent.set(null);
  }
}

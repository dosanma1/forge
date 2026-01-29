import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
} from '@angular/core';
import { CdkDropList } from '@angular/cdk/drag-drop';
import { provideIcons } from '@ng-icons/core';
import { lucideFolderOpen, lucideSave } from '@ng-icons/lucide';
import {
  MmcButton,
  MmcIcon,
  MmcAccordionPanel,
  MmcAccordionSection,
} from '@forge/ui';
import { FileTreeComponent, FileTreeNode } from '../file-tree/file-tree.component';
import { NodePaletteComponent } from '../node-palette/node-palette.component';
import { ArchitectureNode, ArchitectureNodeType } from '../../models/architecture-node.model';

@Component({
  selector: 'app-architecture-sidebar',
  standalone: true,
  imports: [
    MmcButton,
    MmcIcon,
    MmcAccordionPanel,
    MmcAccordionSection,
    FileTreeComponent,
    NodePaletteComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideFolderOpen,
      lucideSave,
    }),
  ],
  templateUrl: './architecture-sidebar.component.html',
  styleUrl: './architecture-sidebar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchitectureSidebarComponent {
  /** Project directory path */
  readonly projectPath = input<string | null>(null);

  /** All architecture nodes */
  readonly nodes = input.required<ArchitectureNode[]>();

  /** Currently selected node ID */
  readonly selectedNodeId = input<string | null>(null);

  /** Number of unsaved changes */
  readonly unsavedChanges = input<number>(0);

  /** Connected drop list for palette drag-drop */
  readonly canvasDropList = input<CdkDropList | null>(null);

  /** Emitted when user wants to add a node */
  readonly addNode = output<ArchitectureNodeType>();

  /** Emitted when user selects a node */
  readonly selectNode = output<string>();

  /** Emitted when user wants to save changes */
  readonly saveChanges = output<void>();

  /** Emitted when user wants to open a folder */
  readonly openFolder = output<void>();

  /** Emitted when a file is selected in explorer */
  readonly fileSelect = output<FileTreeNode>();

  /** Emitted when a directory is selected in explorer */
  readonly directorySelect = output<FileTreeNode>();

  protected onAddNode(type: ArchitectureNodeType): void {
    this.addNode.emit(type);
  }

  protected onSelectNode(nodeId: string): void {
    this.selectNode.emit(nodeId);
  }

  protected onSaveChanges(): void {
    this.saveChanges.emit();
  }

  protected onOpenFolder(): void {
    this.openFolder.emit();
  }

  protected onFileSelect(node: FileTreeNode): void {
    this.fileSelect.emit(node);
  }

  protected onDirectorySelect(node: FileTreeNode): void {
    this.directorySelect.emit(node);
  }

  protected getNodeIcon(node: ArchitectureNode): string {
    switch (node.type) {
      case 'service':
        return 'S';
      case 'app':
        return 'A';
      case 'library':
        return 'L';
    }
  }

  protected getNodeIconClass(node: ArchitectureNode): string {
    switch (node.type) {
      case 'service':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400';
      case 'app':
        return 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400';
      case 'library':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400';
    }
  }
}

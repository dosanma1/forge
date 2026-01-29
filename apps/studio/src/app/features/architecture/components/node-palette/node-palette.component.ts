import {
  Component,
  ChangeDetectionStrategy,
  output,
  signal,
  input,
} from '@angular/core';
import { CdkDrag, CdkDragPlaceholder, CdkDragPreview, CdkDragStart, CdkDropList } from '@angular/cdk/drag-drop';
import { provideIcons } from '@ng-icons/core';
import {
  lucideServer,
  lucideMonitor,
  lucidePackage,
  lucidePlus,
} from '@ng-icons/lucide';
import { MmcIcon } from '@forge/ui';
import { ArchitectureNodeType } from '../../models/architecture-node.model';

export interface NodePaletteItem {
  type: ArchitectureNodeType;
  label: string;
  icon: string;
  description: string;
  colorClass: string;
}

@Component({
  selector: 'app-node-palette',
  standalone: true,
  imports: [MmcIcon, CdkDrag, CdkDragPreview, CdkDragPlaceholder, CdkDropList],
  viewProviders: [
    provideIcons({
      lucideServer,
      lucideMonitor,
      lucidePackage,
      lucidePlus,
    }),
  ],
  templateUrl: './node-palette.component.html',
  styleUrl: './node-palette.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NodePaletteComponent {
  /** Connected drop list for drag-drop (the canvas) */
  readonly connectedDropList = input<CdkDropList | null>(null);

  /** Emits when user wants to add a new node */
  readonly addNode = output<ArchitectureNodeType>();

  protected readonly paletteItems = signal<NodePaletteItem[]>([
    {
      type: 'service',
      label: 'Service',
      icon: 'lucideServer',
      description: 'Backend microservice',
      colorClass: 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400',
    },
    {
      type: 'app',
      label: 'Application',
      icon: 'lucideMonitor',
      description: 'Frontend application',
      colorClass: 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400',
    },
    {
      type: 'library',
      label: 'Library',
      icon: 'lucidePackage',
      description: 'Shared code library',
      colorClass: 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400',
    },
  ]);

  /** Currently dragging node type */
  readonly draggingType = signal<ArchitectureNodeType | null>(null);

  /** Prevent items from being dropped back into the palette */
  noReturnPredicate(): boolean {
    return false;
  }

  /** Get connected drop lists array */
  protected getConnectedTo(): CdkDropList[] {
    const connected = this.connectedDropList();
    return connected ? [connected] : [];
  }

  protected onAddNode(type: ArchitectureNodeType): void {
    this.addNode.emit(type);
  }

  protected onDragStarted(event: CdkDragStart, type: ArchitectureNodeType): void {
    this.draggingType.set(type);
  }
}

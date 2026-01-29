import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import {
  lucideTrash,
  lucideServer,
  lucideMonitor,
  lucidePackage,
} from '@ng-icons/lucide';
import {
  MmcButton,
  MmcIcon,
  MmcInput,
  MmcLabel,
  MmcTextarea,
  SelectComponent,
  OptionComponent,
  MmcBadge,
} from '@forge/ui';
import {
  ArchitectureNode,
  ServiceNode,
  AppNode,
  LibraryNode,
  ServiceLanguage,
  ServiceDeployer,
  AppFramework,
  AppDeployer,
  LibraryLanguage,
} from '../../models/architecture-node.model';
import { NodeMetadataService } from '../../../../shared/components/node/services/node-metadata.service';
import { NodeStyleService } from '../../../../shared/components/node/services/node-style.service';

@Component({
  selector: 'app-property-panel',
  standalone: true,
  imports: [
    FormsModule,
    MmcButton,
    MmcIcon,
    MmcInput,
    MmcLabel,
    MmcTextarea,
    SelectComponent,
    OptionComponent,
    MmcBadge,
  ],
  viewProviders: [
    provideIcons({
      lucideTrash,
      lucideServer,
      lucideMonitor,
      lucidePackage,
    }),
  ],
  templateUrl: './property-panel.component.html',
  styleUrl: './property-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PropertyPanelComponent {
  private readonly metadataService = inject(NodeMetadataService);
  private readonly styleService = inject(NodeStyleService);

  /** The currently selected node */
  readonly node = input<ArchitectureNode | null>(null);

  /** Emits when a property changes */
  readonly nodeChange = output<ArchitectureNode>();

  /** Emits when delete is requested */
  readonly deleteNode = output<string>();

  protected readonly nodeIcon = computed(() => {
    const node = this.node();
    return node ? this.metadataService.getIcon(node.type) : 'lucideServer';
  });

  protected readonly nodeColorClass = computed(() => {
    const node = this.node();
    return node ? this.styleService.getBadgeClass(node.type) : '';
  });

  protected readonly nodeTypeLabel = computed(() => {
    const node = this.node();
    return node ? this.metadataService.getLabel(node.type) : '';
  });

  protected isService(node: ArchitectureNode): node is ServiceNode {
    return node.type === 'service';
  }

  protected isApp(node: ArchitectureNode): node is AppNode {
    return node.type === 'app';
  }

  protected isLibrary(node: ArchitectureNode): node is LibraryNode {
    return node.type === 'library';
  }

  protected updateProperty(
    key: string,
    value: string | ServiceLanguage | ServiceDeployer | AppFramework | AppDeployer | LibraryLanguage,
  ): void {
    const currentNode = this.node();
    if (!currentNode) return;

    const updatedNode = { ...currentNode, [key]: value } as ArchitectureNode;
    this.nodeChange.emit(updatedNode);
  }

  protected addTag(event: Event): void {
    const input = event.target as HTMLInputElement;
    const tag = input.value.trim();
    if (!tag) return;

    const currentNode = this.node();
    if (!currentNode) return;

    const currentTags = currentNode.tags || [];
    if (currentTags.includes(tag)) {
      input.value = '';
      return;
    }

    const updatedNode = {
      ...currentNode,
      tags: [...currentTags, tag],
    } as ArchitectureNode;
    this.nodeChange.emit(updatedNode);
    input.value = '';
  }

  protected removeTag(tag: string): void {
    const currentNode = this.node();
    if (!currentNode) return;

    const updatedNode = {
      ...currentNode,
      tags: (currentNode.tags || []).filter((t) => t !== tag),
    } as ArchitectureNode;
    this.nodeChange.emit(updatedNode);
  }

  protected onDelete(): void {
    const currentNode = this.node();
    if (currentNode) {
      this.deleteNode.emit(currentNode.id);
    }
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  effect,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import {
  lucideServer,
  lucideMonitor,
  lucidePackage,
  lucideX,
  lucideTrash,
  lucideGlobe,
  lucidePlus,
} from '@ng-icons/lucide';
import {
  MmcButton,
  MmcIcon,
  MmcInput,
  MmcLabel,
  SelectComponent,
  OptionComponent,
} from '@forge/ui';
import {
  ArchitectureNodeType,
  ServiceLanguage,
  ServiceDeployer,
  AppFramework,
  AppDeployer,
  LibraryLanguage,
  ArchitectureNode,
  ServiceNode,
  AppNode,
  LibraryNode,
  createServiceNode,
  createAppNode,
  createLibraryNode,
  createHttpTransport,
  HttpTransport,
} from '../../models/architecture-node.model';
import { NodeMetadataService } from '../../../../shared/components/node/services/node-metadata.service';
import { NodeStyleService } from '../../../../shared/components/node/services/node-style.service';
import { ViewportService, ViewportData } from '../../../../shared/services/viewport.service';

export interface NodeConfigPanelData {
  type: ArchitectureNodeType;
  position: { x: number; y: number };
  node?: ArchitectureNode; // Existing node for editing
}

@Component({
  selector: 'app-node-config-panel',
  standalone: true,
  imports: [
    FormsModule,
    MmcButton,
    MmcIcon,
    MmcInput,
    MmcLabel,
    SelectComponent,
    OptionComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideServer,
      lucideMonitor,
      lucidePackage,
      lucideX,
      lucideTrash,
      lucideGlobe,
      lucidePlus,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './node-config-panel.component.html',
  styleUrl: './node-config-panel.component.scss',
})
export class NodeConfigPanelComponent {
  private readonly metadataService = inject(NodeMetadataService);
  private readonly styleService = inject(NodeStyleService);
  private readonly viewportService = inject(ViewportService);

  /** Panel configuration data */
  readonly data = input<NodeConfigPanelData | null>(null);

  /** Viewport for positioning (pan/zoom) */
  readonly viewport = input<ViewportData>({ x: 0, y: 0, zoom: 1 });

  /** Emitted when the user saves the node */
  readonly save = output<ArchitectureNode>();

  /** Emitted when the user cancels */
  readonly close = output<void>();

  /** Emitted when the user deletes the node */
  readonly delete = output<string>();

  /** Emitted when the user adds a transport to a service */
  readonly addTransport = output<{
    nodeId: string;
    transport: HttpTransport;
  }>();

  // Form state
  protected name = '';
  protected serviceLanguage: ServiceLanguage = 'go';
  protected serviceDeployer: ServiceDeployer = 'helm';
  protected appFramework: AppFramework = 'angular';
  protected appDeployer: AppDeployer = 'firebase';
  protected libraryLanguage: LibraryLanguage = 'go';

  constructor() {
    // Populate form when editing existing node
    effect(() => {
      const d = this.data();
      if (d?.node) {
        this.name = d.node.name;
        if (d.type === 'service') {
          const sn = d.node as ServiceNode;
          this.serviceLanguage = sn.language;
          this.serviceDeployer = sn.deployer;
        } else if (d.type === 'app') {
          const an = d.node as AppNode;
          this.appFramework = an.framework;
          this.appDeployer = an.deployer;
        } else if (d.type === 'library') {
          const ln = d.node as LibraryNode;
          this.libraryLanguage = ln.language;
        }
      } else if (d) {
        // Reset form for new node
        this.name = '';
        this.serviceLanguage = 'go';
        this.serviceDeployer = 'helm';
        this.appFramework = 'angular';
        this.appDeployer = 'firebase';
        this.libraryLanguage = 'go';
      }
    });
  }

  /** True when editing an existing saved node (not a DRAFT node) */
  protected readonly isEditing = computed(() => {
    const d = this.data();
    return !!d?.node && d.node.state === 'SAVED';
  });

  protected readonly panelPosition = computed(() => {
    const d = this.data();
    if (!d) return { x: 0, y: 0 };
    return this.viewportService.calculatePanelPosition(d.position, this.viewport());
  });

  protected readonly headerTitle = computed(() => {
    const d = this.data();
    if (!d) return '';
    const isEdit = !!d.node;
    const label = this.metadataService.getLabel(d.type);
    return isEdit ? `Edit ${label}` : `Add ${label}`;
  });

  protected readonly headerIcon = computed(() => {
    const type = this.data()?.type;
    return type ? this.metadataService.getIcon(type) : 'lucidePackage';
  });

  protected readonly headerBgClass = computed(() => {
    const type = this.data()?.type;
    return type ? this.styleService.getHeaderBgClass(type) : 'bg-muted';
  });

  protected readonly previewRootPath = computed(() => {
    const type = this.data()?.type;
    const kebabName = this.name.toLowerCase().replace(/\s+/g, '-') || 'name';
    return type ? this.metadataService.generateRootPath(type, kebabName) : kebabName;
  });

  protected isValid(): boolean {
    return this.name.trim().length > 0;
  }

  /** Check if service already has HTTP transport */
  protected readonly hasHttpTransport = computed(() => {
    const d = this.data();
    if (d?.type !== 'service' || !d.node) return false;
    const serviceNode = d.node as ServiceNode;
    return serviceNode.transports?.some((t) => t.type === 'http') ?? false;
  });

  /** Add HTTP transport to the service */
  protected onAddHttpTransport(): void {
    const d = this.data();
    if (!d?.node || d.type !== 'service') return;

    const transport = createHttpTransport('/', 'v1');
    this.addTransport.emit({ nodeId: d.node.id, transport });
  }

  protected onClose(): void {
    this.close.emit();
  }

  protected onDelete(): void {
    const nodeId = this.data()?.node?.id;
    if (nodeId) {
      this.delete.emit(nodeId);
    }
  }

  protected onSave(): void {
    if (!this.isValid()) return;

    const d = this.data();
    if (!d) return;

    const kebabName = this.name.toLowerCase().replace(/\s+/g, '-');
    const position = d.position;

    let node: ArchitectureNode;

    if (d.node) {
      // Update existing node
      node = { ...d.node, name: kebabName };
      if (d.type === 'service') {
        (node as ServiceNode).language = this.serviceLanguage;
        (node as ServiceNode).deployer = this.serviceDeployer;
        (node as ServiceNode).root = `backend/services/${kebabName}`;
      } else if (d.type === 'app') {
        (node as AppNode).framework = this.appFramework;
        (node as AppNode).deployer = this.appDeployer;
        (node as AppNode).root = `frontend/apps/${kebabName}`;
      } else if (d.type === 'library') {
        (node as LibraryNode).language = this.libraryLanguage;
        (node as LibraryNode).root = `shared/${kebabName}`;
      }
    } else {
      // Create new node
      switch (d.type) {
        case 'service':
          node = createServiceNode(
            kebabName,
            this.serviceLanguage,
            this.serviceDeployer,
            position,
          );
          break;
        case 'app':
          node = createAppNode(
            kebabName,
            this.appFramework,
            this.appDeployer,
            position,
          );
          break;
        case 'library':
          node = createLibraryNode(kebabName, this.libraryLanguage, position);
          break;
      }
    }

    this.save.emit(node);
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  output,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucidePlus } from '@ng-icons/lucide';
import { Connection, NodeChange, Vflow, VflowComponent } from 'ngx-vflow';
import { MmcIcon } from '@forge/ui';
import {
  ServiceNode,
  HttpTransport,
  HttpEndpoint,
  createHttpTransport,
} from '../../models/architecture-node.model';
import { TransportGroupNodeComponent, TransportGroupNodeData } from './components/nodes/transport-group-node/transport-group-node.component';
import { ResourceCardNodeComponent, ResourceCardNodeData } from './components/nodes/resource-card-node/resource-card-node.component';
import { TransportConfigPanelComponent, TransportConfigPanelData } from '../../components/panels/transport-config-panel/transport-config-panel.component';
import { TransportEditorService } from '../../services/transport-editor.service';

interface ServiceDetailNode {
  id: string;
  point: WritableSignal<{ x: number; y: number }>;
  type: typeof TransportGroupNodeComponent | typeof ResourceCardNodeComponent;
  data: WritableSignal<TransportGroupNodeData | ResourceCardNodeData>;
}

interface ServiceDetailEdge {
  id: string;
  source: string;
  sourceHandle: string;
  target: string;
  targetHandle: string;
}

/**
 * Canvas Level 2: Service Detail / Endpoint Designer
 *
 * This view shows the detailed internal structure of a service using ngx-vflow:
 * - Transport group nodes on the left containing endpoint handles
 * - Resource card nodes on the right
 * - Edges connecting endpoints to resources
 */
@Component({
  selector: 'app-service-detail',
  standalone: true,
  imports: [Vflow, MmcIcon, TransportConfigPanelComponent],
  templateUrl: './service-detail.component.html',
  styleUrl: './service-detail.component.scss',
  viewProviders: [
    provideIcons({
      lucidePlus,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full w-full',
  },
})
export class ServiceDetailComponent {
  private readonly transportEditor = inject(TransportEditorService);

  /** Reference to the vflow component for viewport */
  protected readonly vflowComponent = viewChild(VflowComponent);

  /** The service node being edited */
  readonly serviceNode = input.required<ServiceNode>();

  /** Event emitted when a transport is added */
  readonly addTransport = output<{ nodeId: string; transport: HttpTransport }>();

  /** Event emitted when an endpoint is added */
  readonly addEndpoint = output<{ nodeId: string; transportId: string; endpoint: HttpEndpoint }>();

  /** Internal nodes for vflow */
  readonly vflowNodes = signal<ServiceDetailNode[]>([]);

  /** Internal edges for vflow */
  readonly vflowEdges = signal<ServiceDetailEdge[]>([]);

  /** Resources defined for this service (placeholder for now) */
  private readonly resources = signal<ResourceCardNodeData[]>([]);

  /** Data for the transport config panel */
  protected readonly transportConfigPanelData = signal<TransportConfigPanelData | null>(null);

  /** Expose viewport for the config panel */
  protected readonly viewport = computed(() => this.vflowComponent()?.viewport() ?? { x: 0, y: 0, zoom: 1 });

  /** Cache for vflow nodes to maintain stable signal references */
  private nodeCache = new Map<string, ServiceDetailNode>();

  constructor() {
    // Sync service node changes to vflow nodes
    effect(() => {
      const service = this.serviceNode();
      if (!service) return;

      this.syncNodes(service);
    });

    // Show transport config panel when transport is selected
    effect(() => {
      const transportSelection = this.transportEditor.selectedTransport();
      const service = this.serviceNode();

      if (transportSelection && service && transportSelection.nodeId === service.id) {
        const transport = service.transports?.find(
          (t) => t.type === 'http' && t.id === transportSelection.transportId
        ) as HttpTransport | undefined;

        if (transport) {
          // Find the transport node position for panel positioning
          const transportNode = this.vflowNodes().find(
            (n) => n.id === `transport-${transport.id}`
          );
          const position = transportNode?.point() ?? { x: 50, y: 50 };

          this.transportConfigPanelData.set({
            nodeId: service.id,
            nodeName: service.name,
            transport,
            position, // Use node position directly, ViewportService handles the positioning
          });
        }
      } else {
        this.transportConfigPanelData.set(null);
      }
    });
  }

  /**
   * Sync nodes with service data, using cache to maintain stable signal references.
   * This prevents vflow from losing track of nodes when data changes.
   */
  private syncNodes(service: ServiceNode): void {
    const httpTransports = service.transports?.filter(t => t.type === 'http') ?? [];
    const currentResources = this.resources();

    // Build set of expected node IDs
    const expectedNodeIds = new Set<string>();
    httpTransports.forEach(t => expectedNodeIds.add(`transport-${t.id}`));
    currentResources.forEach(r => expectedNodeIds.add(`resource-${r.id}`));

    // Remove nodes that no longer exist
    for (const id of this.nodeCache.keys()) {
      if (!expectedNodeIds.has(id)) {
        this.nodeCache.delete(id);
      }
    }

    // Update or create transport nodes
    let transportY = 50;
    for (const transport of httpTransports) {
      const nodeId = `transport-${transport.id}`;
      let cached = this.nodeCache.get(nodeId);

      if (cached) {
        // Update existing node's data signal (keep same signal reference)
        cached.data.set({
          transport: transport as HttpTransport,
          nodeId: service.id,
        });
      } else {
        // Create new cached node with stable signals
        cached = {
          id: nodeId,
          point: signal({ x: 50, y: transportY }),
          type: TransportGroupNodeComponent,
          data: signal<TransportGroupNodeData>({
            transport: transport as HttpTransport,
            nodeId: service.id,
          }),
        };
        this.nodeCache.set(nodeId, cached);
      }

      // Calculate height based on number of endpoints for next node positioning
      const height = 120 + (transport as HttpTransport).endpoints.length * 40;
      transportY += height + 30;
    }

    // Update or create resource nodes
    let resourceY = 50;
    for (const resource of currentResources) {
      const nodeId = `resource-${resource.id}`;
      let cached = this.nodeCache.get(nodeId);

      if (cached) {
        // Update existing node's data signal
        cached.data.set(resource);
      } else {
        // Create new cached node
        cached = {
          id: nodeId,
          point: signal({ x: 450, y: resourceY }),
          type: ResourceCardNodeComponent,
          data: signal<ResourceCardNodeData>(resource),
        };
        this.nodeCache.set(nodeId, cached);
      }

      resourceY += 250;
    }

    // Build the nodes array from cache (preserves signal references)
    const nodes: ServiceDetailNode[] = [];
    for (const transport of httpTransports) {
      const cached = this.nodeCache.get(`transport-${transport.id}`);
      if (cached) nodes.push(cached);
    }
    for (const resource of currentResources) {
      const cached = this.nodeCache.get(`resource-${resource.id}`);
      if (cached) nodes.push(cached);
    }

    this.vflowNodes.set(nodes);
  }

  /** Add a new HTTP transport group */
  protected onAddHttpTransport(): void {
    const service = this.serviceNode();
    if (!service) return;

    const transport = createHttpTransport('/', 'v1');
    this.addTransport.emit({ nodeId: service.id, transport });
  }

  /** Add a new resource (controller interface) */
  protected onAddResource(): void {
    const newResource: ResourceCardNodeData = {
      id: `resource-${Date.now()}`,
      name: 'NewResource',
      basePath: '/new-resource',
      version: 'v1',
      methods: [],
    };

    this.resources.update(r => [...r, newResource]);
    // Sync nodes to include the new resource
    this.syncNodes(this.serviceNode());
  }

  /** Handle node position changes */
  protected handleNodeChanges(changes: NodeChange[]): void {
    // Handle position changes if needed
  }

  /** Handle new connections (endpoint to resource) */
  protected handleConnect(connection: Connection): void {
    const newEdge: ServiceDetailEdge = {
      id: `edge-${Date.now()}`,
      source: connection.source,
      sourceHandle: connection.sourceHandle ?? '',
      target: connection.target,
      targetHandle: connection.targetHandle ?? '',
    };

    this.vflowEdges.update(edges => [...edges, newEdge]);
  }

  /** Handle closing the transport config panel */
  protected onTransportConfigClose(): void {
    this.transportEditor.clearSelection();
    this.transportConfigPanelData.set(null);
  }

  /** Handle adding an endpoint from the transport config panel */
  protected onTransportAddEndpoint(event: { nodeId: string; transportId: string; endpoint: HttpEndpoint }): void {
    this.addEndpoint.emit(event);
  }

  /** Handle base path change from the transport config panel */
  protected onTransportBasePathChange(event: { nodeId: string; transportId: string; basePath: string }): void {
    // Emit event to parent to update the transport base path
    // For now, just log - the parent architecture component handles the actual update
    console.log('Base path change:', event);
  }
}

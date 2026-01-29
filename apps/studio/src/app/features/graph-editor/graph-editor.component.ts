import { CdkDragDrop, CdkDropList } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  viewChild,
  WritableSignal,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideTrash } from '@ng-icons/lucide';
import {
  Edge,
  NodeChange,
  NodeSelectedChange,
  EdgeSelectChange,
  Vflow,
  VflowComponent,
  Connection,
} from 'ngx-vflow';
import { MmcButton, MmcIcon } from '@forge/ui';
import { ServiceNodeComponent } from '../architecture/components/nodes/service-node/service-node.component';
import { AppNodeComponent } from '../architecture/components/nodes/app-node/app-node.component';
import { LibraryNodeComponent } from '../architecture/components/nodes/library-node/library-node.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';

export interface IPosition {
  x: number;
  y: number;
}

export type GraphNodeType = 'service' | 'app' | 'library';

export interface GraphNode {
  id: string;
  name: string;
  description?: string;
  type: GraphNodeType;
  positionX: number;
  positionY: number;
  data?: Record<string, unknown>;
}

export interface GraphEdge {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
}

interface VflowNode {
  id: string;
  point: WritableSignal<{ x: number; y: number }>;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  type: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: WritableSignal<any>;
}

@Component({
  selector: 'app-graph-editor',
  templateUrl: './graph-editor.component.html',
  styleUrl: './graph-editor.component.scss',
  imports: [Vflow, ToolbarComponent, CdkDropList, MmcButton, MmcIcon],
  viewProviders: [provideIcons({ lucideTrash })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full w-full bg-background',
  },
})
export class GraphEditorComponent {
  private readonly elementRef = inject(ElementRef);

  /** Input nodes from parent */
  readonly graphNodes = input<GraphNode[]>([]);

  /** Input edges from parent */
  readonly graphEdges = input<GraphEdge[]>([]);

  /** Emitted when nodes change */
  readonly nodesChanged = output<GraphNode[]>();

  /** Emitted when edges change */
  readonly edgesChanged = output<GraphEdge[]>();

  /** Emitted when node selection changes */
  readonly nodeSelected = output<string | null>();

  /** Emitted when a node type is dropped on the canvas */
  readonly nodeDrop = output<{ type: string; position: { x: number; y: number } }>();

  readonly vFlowComponent = viewChild.required(VflowComponent);

  /** Drop list reference for connecting to external palette */
  readonly dropList = viewChild.required('canvasDropList', { read: CdkDropList });

  /** Expose viewport for external coordinate conversion (reactive) */
  readonly viewport = computed(() => this.vFlowComponent().viewport());

  /** Convert flow coordinates to document/screen coordinates */
  flowPointToDocumentPoint(flowPoint: { x: number; y: number }): { x: number; y: number } {
    const vp = this.vFlowComponent().viewport();
    const containerRect = this.elementRef.nativeElement.getBoundingClientRect();
    return {
      x: (flowPoint.x * vp.zoom) + vp.x + containerRect.left,
      y: (flowPoint.y * vp.zoom) + vp.y + containerRect.top,
    };
  }

  readonly contextMenuPosition = signal<IPosition | undefined>(undefined);
  readonly selectedNodes = signal<string[]>([]);
  readonly selectedEdges = signal<string[]>([]);

  readonly selectedItems = computed(() => {
    const selectedNodes = this.selectedNodes();
    const selectedEdges = this.selectedEdges();
    if (!selectedNodes.length && !selectedEdges.length) {
      return null;
    }
    return {
      nodes: selectedNodes,
      edges: selectedEdges,
    };
  });

  /** Maps node type to vflow component */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private readonly nodeTypeToComponent: Record<GraphNodeType, any> = {
    service: ServiceNodeComponent,
    app: AppNodeComponent,
    library: LibraryNodeComponent,
  };

  /** Cache for vflow nodes to maintain stable signal references */
  private nodeCache = new Map<string, VflowNode>();

  /** Signal holding the current vflow nodes */
  readonly vflowNodes = signal<VflowNode[]>([]);

  constructor() {
    // Effect to sync graphNodes input with vflowNodes signal
    effect(() => {
      const inputNodes = this.graphNodes();

      // If no input nodes, show empty canvas
      if (inputNodes.length === 0) {
        this.vflowNodes.set([]);
        return;
      }

      // Get current node IDs
      const inputNodeIds = new Set(inputNodes.map((n) => n.id));

      // Remove nodes that no longer exist
      for (const id of this.nodeCache.keys()) {
        if (!inputNodeIds.has(id)) {
          this.nodeCache.delete(id);
        }
      }

      // Update or create nodes
      const vflowNodeList: VflowNode[] = [];

      for (const node of inputNodes) {
        let cached = this.nodeCache.get(node.id);

        if (cached) {
          // Only update data signal, NOT point - let vflow manage drag positions internally
          // This prevents feedback loop during dragging
          cached.data.set(node.data ?? node);
          // Update type in case it changed
          cached.type = this.nodeTypeToComponent[node.type];
        } else {
          // Create new cached node with stable signals
          // Point is only set on initial creation
          cached = {
            id: node.id,
            point: signal({ x: node.positionX, y: node.positionY }),
            type: this.nodeTypeToComponent[node.type],
            data: signal(node.data ?? node),
          };
          this.nodeCache.set(node.id, cached);
        }

        vflowNodeList.push(cached);
      }

      this.vflowNodes.set(vflowNodeList);
    });
  }

  /** Converts graphEdges input to vflow edge format */
  readonly vflowEdges = computed(() => {
    const inputEdges = this.graphEdges();

    return inputEdges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      sourceHandle: edge.sourceHandle,
      target: edge.target,
      targetHandle: edge.targetHandle,
    }));
  });

  fitScreen(): void {
    this.vFlowComponent().fitView({ duration: 500, padding: 2 });
  }

  zoomIn(): void {
    this.vFlowComponent().zoomTo(this.vFlowComponent().viewport().zoom + 0.1);
  }

  zoomOut(): void {
    this.vFlowComponent().zoomTo(this.vFlowComponent().viewport().zoom - 0.1);
  }

  deleteEdge(edge: Edge): void {
    console.log('deleteEdge', edge);
  }

  handleNodeChanges(changes: NodeChange[]): void {
    if (changes.length === 0) {
      return;
    }

    // Handle position changes
    const positionChanges = changes.filter((c) => c.type === 'position');
    if (positionChanges.length > 0) {
      const nodes = this.graphNodes().map((n) => {
        const change = positionChanges.find((c) => c.id === n.id);
        if (change && change.type === 'position' && change.point) {
          return { ...n, positionX: change.point.x, positionY: change.point.y };
        }
        return n;
      });
      this.nodesChanged.emit(nodes);
    }
  }

  handleNodeSelection(changes: NodeSelectedChange[]): void {
    const selectedIds = changes
      .filter((c) => c.selected)
      .map((c) => c.id);
    this.selectedNodes.set(selectedIds);
    // Emit first selected node or null to notify parent
    this.nodeSelected.emit(selectedIds[0] ?? null);
  }

  handleEdgeSelection(changes: EdgeSelectChange[]): void {
    const selectedIds = changes
      .filter((c) => c.selected)
      .map((c) => c.id);
    this.selectedEdges.set(selectedIds);
  }

  handleConnect(connection: Connection): void {
    // Create new edge from connection event and emit to parent
    const newEdge: GraphEdge = {
      id: `${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source,
      sourceHandle: connection.sourceHandle,
      target: connection.target,
      targetHandle: connection.targetHandle,
    };
    const currentEdges = this.graphEdges();
    this.edgesChanged.emit([...currentEdges, newEdge]);
  }

  protected onContextMenuClicked(event: MouseEvent): void {
    this.contextMenuPosition.set(
      this.vFlowComponent().documentPointToFlowPoint({
        x: event.pageX,
        y: event.pageY,
      }),
    );
  }

  /** Allow all drops from palette */
  allowDrop = () => true;

  /** Handle drop from palette */
  handleDrop(event: CdkDragDrop<unknown>): void {
    const nodeType = event.item.data as string;
    if (!nodeType) return;

    // Get drop position and convert to flow coordinates
    const dropPoint = event.dropPoint;
    const flowPoint = this.vFlowComponent().documentPointToFlowPoint({
      x: dropPoint.x,
      y: dropPoint.y,
    });

    this.nodeDrop.emit({
      type: nodeType,
      position: flowPoint,
    });
  }
}

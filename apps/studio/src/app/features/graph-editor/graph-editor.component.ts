import { CdkDropListGroup } from '@angular/cdk/drag-drop';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
  signal,
  viewChild,
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
import { StandardNodeComponent } from './components/nodes/standard-node/standard-node.component';
import { ToolbarComponent } from './components/toolbar/toolbar.component';
import { ActionType, DialogueNode, IPosition } from './models';

export interface GraphNode {
  id: string;
  name: string;
  description: string;
  type: 'standard' | 'start' | 'graph';
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

@Component({
  selector: 'app-graph-editor',
  templateUrl: './graph-editor.component.html',
  styleUrl: './graph-editor.component.scss',
  imports: [Vflow, ToolbarComponent, CdkDropListGroup, MmcButton, MmcIcon],
  viewProviders: [provideIcons({ lucideTrash })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'block h-full w-full bg-background',
  },
})
export class GraphEditorComponent {
  /** Input nodes from parent */
  readonly graphNodes = input<GraphNode[]>([]);

  /** Input edges from parent */
  readonly graphEdges = input<GraphEdge[]>([]);

  /** Emitted when nodes change */
  readonly nodesChanged = output<GraphNode[]>();

  /** Emitted when edges change */
  readonly edgesChanged = output<GraphEdge[]>();

  readonly vFlowComponent = viewChild.required(VflowComponent);

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

  /** Test nodes using StandardNodeComponent */
  nodes = [
    {
      id: '1',
      point: signal({ x: 100, y: 100 }),
      type: StandardNodeComponent,
      data: signal(
        new DialogueNode({
          id: '1',
          name: 'Data_Gathering',
          positionX: 100,
          positionY: 100,
          actions: [
            {
              id: 'a1',
              type: ActionType.Text,
              content: "Hi, I'm Artie! I hope you are having a great day.",
            },
            {
              id: 'a2',
              type: ActionType.ExecuteCode,
              label: 'Execute code',
            },
            {
              id: 'a3',
              type: ActionType.Text,
              content: 'I am your AI powered assistant',
            },
            {
              id: 'a4',
              type: ActionType.Transition,
              label: 'AI Transition',
              options: [
                { id: 'o1', label: 'Weekly brief' },
                { id: 'o2', label: 'Get important emails' },
                { id: 'o3', label: 'Setup team meeting' },
                { id: 'o4', label: 'Upload project details' },
              ],
            },
          ],
        })
      ),
    },
    {
      id: '2',
      point: signal({ x: 500, y: 100 }),
      type: StandardNodeComponent,
      data: signal(
        new DialogueNode({
          id: '2',
          name: 'Weekly_Brief',
          positionX: 500,
          positionY: 100,
          actions: [
            {
              id: 'a5',
              type: ActionType.Text,
              content: 'Here is your weekly brief summary...',
            },
            {
              id: 'a6',
              type: ActionType.ExecuteCode,
              label: 'Fetch calendar data',
            },
          ],
        })
      ),
    },
    {
      id: '3',
      point: signal({ x: 500, y: 300 }),
      type: StandardNodeComponent,
      data: signal(
        new DialogueNode({
          id: '3',
          name: 'Email_Handler',
          positionX: 500,
          positionY: 300,
          actions: [
            {
              id: 'a7',
              type: ActionType.Text,
              content: 'Fetching your important emails...',
            },
            {
              id: 'a8',
              type: ActionType.FillVariable,
              label: 'email_count',
            },
          ],
        })
      ),
    },
  ];

  edges: Edge[] = [
    {
      id: '1-2',
      source: '1',
      sourceHandle: 'transition-a4-o1', // Weekly brief option
      target: '2',
      targetHandle: 'node-2',
    },
    {
      id: '1-3',
      source: '1',
      sourceHandle: 'transition-a4-o2', // Get important emails option
      target: '3',
      targetHandle: 'node-3',
    },
  ];

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
  }

  handleEdgeSelection(changes: EdgeSelectChange[]): void {
    const selectedIds = changes
      .filter((c) => c.selected)
      .map((c) => c.id);
    this.selectedEdges.set(selectedIds);
  }

  handleConnect(connection: Connection): void {
    // Create new edge from connection event
    const newEdge: Edge = {
      id: `${connection.source}-${connection.target}-${Date.now()}`,
      source: connection.source,
      sourceHandle: connection.sourceHandle,
      target: connection.target,
      targetHandle: connection.targetHandle,
    };
    this.edges = [...this.edges, newEdge];
  }

  protected onContextMenuClicked(event: MouseEvent): void {
    this.contextMenuPosition.set(
      this.vFlowComponent().documentPointToFlowPoint({
        x: event.pageX,
        y: event.pageY,
      }),
    );
  }
}

import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  viewChild,
  computed,
} from '@angular/core';
import { CdkDropList } from '@angular/cdk/drag-drop';
import { GraphEditorComponent, GraphNode, GraphEdge } from '../../../graph-editor/graph-editor.component';
import { NodeConfigPanelComponent, NodeConfigPanelData } from '../node-config-panel/node-config-panel.component';
import { ViewportData } from '../../../../shared/services/viewport.service';
import { TransportConfigPanelComponent, TransportConfigPanelData } from '../transport-config-panel/transport-config-panel.component';
import { ArchitectureNode, HttpTransport, HttpEndpoint } from '../../models/architecture-node.model';

@Component({
  selector: 'app-architecture-canvas',
  standalone: true,
  imports: [GraphEditorComponent, NodeConfigPanelComponent, TransportConfigPanelComponent],
  templateUrl: './architecture-canvas.component.html',
  styleUrl: './architecture-canvas.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ArchitectureCanvasComponent {
  /** Graph nodes to display */
  readonly graphNodes = input.required<GraphNode[]>();

  /** Graph edges to display */
  readonly graphEdges = input.required<GraphEdge[]>();

  /** Config panel data (node being edited) */
  readonly configPanelData = input<NodeConfigPanelData | null>(null);

  /** Emitted when nodes change (positions, etc.) */
  readonly nodesChanged = output<GraphNode[]>();

  /** Emitted when edges change */
  readonly edgesChanged = output<GraphEdge[]>();

  /** Emitted when a node is selected */
  readonly nodeSelected = output<string | null>();

  /** Emitted when a node is dropped from palette */
  readonly nodeDrop = output<{ type: string; position: { x: number; y: number } }>();

  /** Emitted when config panel saves */
  readonly configSave = output<ArchitectureNode>();

  /** Emitted when config panel closes */
  readonly configClose = output<void>();

  /** Emitted when config panel deletes node */
  readonly configDelete = output<string>();

  /** Emitted when transport is added via config panel */
  readonly addTransport = output<{ nodeId: string; transport: HttpTransport }>();

  /** Transport config panel data (transport being edited) */
  readonly transportConfigPanelData = input<TransportConfigPanelData | null>(null);

  /** Emitted when transport config panel closes */
  readonly transportConfigClose = output<void>();

  /** Emitted when endpoint is added via transport config panel */
  readonly transportAddEndpoint = output<{ nodeId: string; transportId: string; endpoint: HttpEndpoint }>();

  /** Emitted when base path is changed via transport config panel */
  readonly transportBasePathChange = output<{ nodeId: string; transportId: string; basePath: string }>();

  /** Reference to the graph editor component */
  protected readonly graphEditor = viewChild<GraphEditorComponent>('graphEditor');

  /** Get the drop list for connecting palette */
  readonly dropList = computed(() => {
    const editor = this.graphEditor();
    return editor?.dropList() ?? null;
  });

  /** Get the viewport for panel positioning */
  readonly viewport = computed<ViewportData>(() => {
    const editor = this.graphEditor();
    return editor?.viewport() ?? { x: 0, y: 0, zoom: 1 };
  });

  protected onNodesChanged(nodes: GraphNode[]): void {
    this.nodesChanged.emit(nodes);
  }

  protected onEdgesChanged(edges: GraphEdge[]): void {
    this.edgesChanged.emit(edges);
  }

  protected onNodeSelected(nodeId: string | null): void {
    this.nodeSelected.emit(nodeId);
  }

  protected onNodeDrop(event: { type: string; position: { x: number; y: number } }): void {
    this.nodeDrop.emit(event);
  }

  protected onConfigSave(node: ArchitectureNode): void {
    this.configSave.emit(node);
  }

  protected onConfigClose(): void {
    this.configClose.emit();
  }

  protected onConfigDelete(nodeId: string): void {
    this.configDelete.emit(nodeId);
  }

  protected onAddTransport(event: { nodeId: string; transport: HttpTransport }): void {
    this.addTransport.emit(event);
  }

  protected onTransportConfigClose(): void {
    this.transportConfigClose.emit();
  }

  protected onTransportAddEndpoint(event: { nodeId: string; transportId: string; endpoint: HttpEndpoint }): void {
    this.transportAddEndpoint.emit(event);
  }

  protected onTransportBasePathChange(event: { nodeId: string; transportId: string; basePath: string }): void {
    this.transportBasePathChange.emit(event);
  }
}

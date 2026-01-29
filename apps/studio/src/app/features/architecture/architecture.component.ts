import { Component, computed, effect, inject, signal, viewChild } from '@angular/core';
import { TabChange } from '@forge/ui';
import { ProjectService } from '../project/project.service';
import { FileTreeNode } from './components/file-tree/file-tree.component';
import { GraphNode, GraphEdge } from '../graph-editor/graph-editor.component';
import {
  ArchitectureNode,
  ArchitectureNodeType,
  createServiceNode,
  createAppNode,
  createLibraryNode,
  createHttpTransport,
  ServiceNode,
  HttpTransport,
  HttpEndpoint,
} from './models/architecture-node.model';
import { ArchitectureEdge } from './models/architecture-edge.model';
import { NodeConfigPanelData } from './components/node-config-panel/node-config-panel.component';
import { TransportConfigPanelData } from './components/transport-config-panel/transport-config-panel.component';
import { ArchitectureSidebarComponent } from './components/sidebar/architecture-sidebar.component';
import { ArchitectureCanvasComponent } from './components/canvas/architecture-canvas.component';
import { BottomPanelComponent } from './components/bottom-panel/bottom-panel.component';
import { TransportType } from './components/transport-action/transport-action.component';
import { ForgeJsonService } from './services/forge-json.service';
import { TransportEditorService } from './services/transport-editor.service';

@Component({
  selector: 'app-architecture',
  standalone: true,
  imports: [
    ArchitectureSidebarComponent,
    ArchitectureCanvasComponent,
    BottomPanelComponent,
  ],
  templateUrl: './architecture.component.html',
  styleUrl: './architecture.component.scss',
  host: {
    class: 'flex flex-col h-full',
  },
})
export class ArchitectureComponent {
  private readonly projectService = inject(ProjectService);
  private readonly forgeJsonService = inject(ForgeJsonService);
  private readonly transportEditor = inject(TransportEditorService);

  /** Reference to the architecture canvas component */
  protected readonly architectureCanvas = viewChild<ArchitectureCanvasComponent>('architectureCanvas');

  /** Reference to the bottom panel component */
  protected readonly bottomPanel = viewChild<BottomPanelComponent>('bottomPanel');

  /** Get the canvas drop list for connecting palette */
  protected readonly canvasDropList = computed(() => {
    const canvas = this.architectureCanvas();
    return canvas?.dropList() ?? null;
  });

  /** Data for the inline config panel */
  protected readonly configPanelData = signal<NodeConfigPanelData | null>(null);

  /** Data for the inline transport config panel */
  protected readonly transportConfigPanelData = signal<TransportConfigPanelData | null>(null);

  /** ID of pending node (created but not yet confirmed) - will be removed on cancel */
  private pendingNodeId: string | null = null;

  protected readonly projectPath = computed(() => {
    const project = this.projectService.selectedResource();
    return project?.path ?? null;
  });

  protected readonly isLoading = signal(false);

  constructor() {
    // Auto-load nodes when project path changes
    effect(() => {
      const path = this.projectPath();
      if (path) {
        this.loadNodesFromForgeJson(path);
      } else {
        this.architectureNodes.set([]);
        this.architectureEdges.set([]);
        this.unsavedChanges.set(0);
      }
    });

    // Show transport config panel when transport is selected (mutual exclusion with node panel)
    effect(() => {
      const transportSelection = this.transportEditor.selectedTransport();
      if (transportSelection) {
        // Find the node and transport
        const node = this.architectureNodes().find((n) => n.id === transportSelection.nodeId);
        if (node && node.type === 'service') {
          const serviceNode = node as ServiceNode;
          const transport = serviceNode.transports?.find(
            (t) => t.type === 'http' && t.id === transportSelection.transportId
          ) as HttpTransport | undefined;

          if (transport) {
            // Transport selected - close node config panel and open transport config panel
            this.selectedNodeId.set(null);
            this.configPanelData.set(null);
            this.transportConfigPanelData.set({
              nodeId: node.id,
              nodeName: node.name,
              transport,
              position: { x: node.positionX, y: node.positionY },
            });
          }
        }
      } else {
        // No transport selected - close transport config panel
        this.transportConfigPanelData.set(null);
      }
    });
  }

  private async loadNodesFromForgeJson(workspacePath: string): Promise<void> {
    this.isLoading.set(true);
    try {
      const nodes = await this.forgeJsonService.loadFromForgeJson(workspacePath);
      this.architectureNodes.set(nodes);
      this.unsavedChanges.set(0);
    } catch (err) {
      console.error('Failed to load forge.json:', err);
      // If loading fails, start with empty nodes
      this.architectureNodes.set([]);
    } finally {
      this.isLoading.set(false);
    }
  }

  // Architecture state
  protected readonly architectureNodes = signal<ArchitectureNode[]>([]);
  protected readonly architectureEdges = signal<ArchitectureEdge[]>([]);
  protected readonly selectedNodeId = signal<string | null>(null);
  protected readonly unsavedChanges = signal<number>(0);

  // Convert architecture nodes to graph editor format
  protected readonly graphNodesForEditor = computed<GraphNode[]>(() => {
    return this.architectureNodes().map((node) => ({
      id: node.id,
      name: node.name,
      description: node.description || '',
      type: node.type, // 'service' | 'app' | 'library'
      positionX: node.positionX,
      positionY: node.positionY,
      data: node as unknown as Record<string, unknown>,
    }));
  });

  protected readonly graphEdgesForEditor = computed<GraphEdge[]>(() => {
    return this.architectureEdges().map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      targetHandle: edge.targetHandle,
    }));
  });

  protected readonly architectureJson = computed(() => {
    return JSON.stringify(
      {
        nodes: this.architectureNodes(),
        edges: this.architectureEdges(),
      },
      null,
      2,
    );
  });

  protected readonly selectedNode = computed(() => {
    const nodeId = this.selectedNodeId();
    if (!nodeId) return null;
    return this.architectureNodes().find((n) => n.id === nodeId) ?? null;
  });

  async openFolder(): Promise<void> {
    try {
      const path = await this.projectService.selectDirectory();
      if (path) {
        await this.projectService.open(path);
      }
    } catch (error) {
      console.error('Error opening folder:', error);
    }
  }

  onFileSelect(node: FileTreeNode): void {
    console.log('File selected:', node);
  }

  onDirectorySelect(node: FileTreeNode): void {
    console.log('Directory selected:', node);
  }

  onAddNode(type: ArchitectureNodeType): void {
    // Calculate position for new node (grid layout)
    const existingCount = this.architectureNodes().length;
    const position = {
      x: 100 + (existingCount % 3) * 350,
      y: 100 + Math.floor(existingCount / 3) * 250,
    };

    // Create a temporary node immediately and add to graph
    const tempNode = this.createTempNode(type, position);
    this.architectureNodes.update((nodes) => [...nodes, tempNode]);
    this.pendingNodeId = tempNode.id;

    // Show inline config panel for the new node
    this.configPanelData.set({
      type,
      position,
      node: tempNode,
    });
  }

  onNodeDrop(event: { type: string; position: { x: number; y: number } }): void {
    const type = event.type as ArchitectureNodeType;
    const position = event.position;

    // Create a temporary node immediately and add to graph (state = DRAFT)
    const tempNode = this.createTempNode(type, position);
    this.architectureNodes.update((nodes) => [...nodes, tempNode]);
    this.pendingNodeId = tempNode.id;

    // Show inline config panel for the new node at drop position
    this.configPanelData.set({
      type,
      position,
      node: tempNode,
    });
  }

  /** Create a temporary node with default values */
  private createTempNode(
    type: ArchitectureNodeType,
    position: { x: number; y: number },
  ): ArchitectureNode {
    const tempName = 'new-' + type;
    switch (type) {
      case 'service':
        return createServiceNode(tempName, 'go', 'helm', position);
      case 'app':
        return createAppNode(tempName, 'angular', 'firebase', position);
      case 'library':
        return createLibraryNode(tempName, 'go', position);
    }
  }

  onNodeSelected(nodeId: string | null): void {
    this.selectedNodeId.set(nodeId);

    // Always clear transport selection when node selection changes
    // (transport selection is done separately via transport click)
    this.transportEditor.clearSelection();

    // If selecting a different node while there's a pending node, remove the pending node
    if (this.pendingNodeId && nodeId !== this.pendingNodeId) {
      this.architectureNodes.update((nodes) =>
        nodes.filter((n) => n.id !== this.pendingNodeId),
      );
      this.pendingNodeId = null;
    }

    // Show config panel when a node is selected
    if (nodeId) {
      const node = this.architectureNodes().find((n) => n.id === nodeId);
      if (node) {
        this.configPanelData.set({
          type: node.type,
          position: { x: node.positionX, y: node.positionY },
          node,
        });

        // Auto-switch to Actions tab when a service node is selected
        if (node.type === 'service') {
          this.bottomPanel()?.selectTab(1);
        }
      }
    } else {
      this.configPanelData.set(null);
    }
  }

  onConfigPanelSave(node: ArchitectureNode): void {
    // Set state to SAVED
    const savedNode: ArchitectureNode = { ...node, state: 'SAVED' };

    const existingNode = this.architectureNodes().find((n) => n.id === node.id);

    if (existingNode) {
      // Update existing node (could be DRAFT or already SAVED)
      this.architectureNodes.update((nodes) =>
        nodes.map((n) => (n.id === node.id ? savedNode : n)),
      );
    } else {
      // Add new node (shouldn't happen since we add on drop, but fallback)
      this.architectureNodes.update((nodes) => [...nodes, savedNode]);
    }

    // Clear pending state - node is now confirmed
    this.pendingNodeId = null;
    this.unsavedChanges.update((c) => c + 1);
    this.configPanelData.set(null);
    this.selectedNodeId.set(node.id);
  }

  onConfigPanelClose(): void {
    // If there's a pending node (not yet confirmed), remove it
    if (this.pendingNodeId) {
      this.architectureNodes.update((nodes) =>
        nodes.filter((n) => n.id !== this.pendingNodeId),
      );
      this.pendingNodeId = null;
    }
    this.configPanelData.set(null);
    this.selectedNodeId.set(null);
    this.transportEditor.clearSelection();
  }

  onTransportConfigPanelClose(): void {
    this.transportConfigPanelData.set(null);
    this.transportEditor.clearSelection();
  }

  onTransportBasePathChange(event: { nodeId: string; transportId: string; basePath: string }): void {
    this.architectureNodes.update((nodes) =>
      nodes.map((n) => {
        if (n.id === event.nodeId && n.type === 'service') {
          const serviceNode = n as ServiceNode;
          return {
            ...serviceNode,
            transports: serviceNode.transports?.map((t) => {
              if (t.id === event.transportId && t.type === 'http') {
                return { ...t, basePath: event.basePath };
              }
              return t;
            }),
          };
        }
        return n;
      }),
    );
    this.unsavedChanges.update((c) => c + 1);

    // Update transport config panel data
    const currentPanelData = this.transportConfigPanelData();
    if (currentPanelData && currentPanelData.nodeId === event.nodeId && currentPanelData.transport.id === event.transportId) {
      this.transportConfigPanelData.set({
        ...currentPanelData,
        transport: { ...currentPanelData.transport, basePath: event.basePath },
      });
    }
  }

  onConfigPanelDelete(nodeId: string): void {
    this.onDeleteNode(nodeId);
    this.configPanelData.set(null);
  }

  onAddTransport(event: { nodeId: string; transport: HttpTransport }): void {
    this.architectureNodes.update((nodes) =>
      nodes.map((n) => {
        if (n.id === event.nodeId && n.type === 'service') {
          const serviceNode = n as ServiceNode;
          return {
            ...serviceNode,
            transports: [...(serviceNode.transports ?? []), event.transport],
          };
        }
        return n;
      }),
    );
    this.unsavedChanges.update((c) => c + 1);

    // Update the config panel data to reflect the change
    const updatedNode = this.architectureNodes().find((n) => n.id === event.nodeId);
    if (updatedNode) {
      this.configPanelData.set({
        type: updatedNode.type,
        position: { x: updatedNode.positionX, y: updatedNode.positionY },
        node: updatedNode,
      });
    }
  }

  selectNode(nodeId: string): void {
    this.selectedNodeId.set(
      this.selectedNodeId() === nodeId ? null : nodeId,
    );
  }

  onNodesChange(nodes: GraphNode[]): void {
    // Update architecture node positions from graph editor changes
    const currentNodes = this.architectureNodes();
    const updatedNodes = currentNodes.map((archNode) => {
      const graphNode = nodes.find((n) => n.id === archNode.id);
      if (graphNode) {
        return {
          ...archNode,
          positionX: graphNode.positionX,
          positionY: graphNode.positionY,
        };
      }
      return archNode;
    });
    this.architectureNodes.set(updatedNodes);
    this.unsavedChanges.update((c) => c + 1);

    // Update config panel position if the node being edited has moved
    const currentPanelData = this.configPanelData();
    if (currentPanelData?.node) {
      const movedNode = nodes.find((n) => n.id === currentPanelData.node?.id);
      if (movedNode) {
        this.configPanelData.set({
          ...currentPanelData,
          position: { x: movedNode.positionX, y: movedNode.positionY },
        });
      }
    }

    // Update transport config panel position if the node being edited has moved
    const currentTransportPanelData = this.transportConfigPanelData();
    if (currentTransportPanelData) {
      const movedNode = nodes.find((n) => n.id === currentTransportPanelData.nodeId);
      if (movedNode) {
        this.transportConfigPanelData.set({
          ...currentTransportPanelData,
          position: { x: movedNode.positionX, y: movedNode.positionY },
        });
      }
    }
  }

  onEdgesChange(edges: GraphEdge[]): void {
    // Convert graph edges to architecture edges
    const archEdges: ArchitectureEdge[] = edges.map((e) => ({
      id: e.id,
      source: e.source,
      target: e.target,
      sourceHandle: e.sourceHandle,
      targetHandle: e.targetHandle,
      dependencyType: 'uses', // Default dependency type
    }));
    this.architectureEdges.set(archEdges);
    this.unsavedChanges.update((c) => c + 1);
  }

  async saveChanges(): Promise<void> {
    const path = this.projectPath();
    if (!path) {
      console.error('No project path to save to');
      return;
    }

    this.isLoading.set(true);
    try {
      await this.forgeJsonService.saveToForgeJson(path, this.architectureNodes());
      this.unsavedChanges.set(0);
      console.log('Saved changes to forge.json');
    } catch (err) {
      console.error('Failed to save forge.json:', err);
    } finally {
      this.isLoading.set(false);
    }
  }

  onNodePropertyChange(updatedNode: ArchitectureNode): void {
    this.architectureNodes.update((nodes) =>
      nodes.map((n) => (n.id === updatedNode.id ? updatedNode : n)),
    );
    this.unsavedChanges.update((c) => c + 1);
  }

  onDeleteNode(nodeId: string): void {
    this.architectureNodes.update((nodes) =>
      nodes.filter((n) => n.id !== nodeId),
    );
    // Also remove edges connected to this node
    this.architectureEdges.update((edges) =>
      edges.filter((e) => e.source !== nodeId && e.target !== nodeId),
    );
    this.selectedNodeId.set(null);
    this.unsavedChanges.update((c) => c + 1);
  }

  getNodeIcon(node: ArchitectureNode): string {
    switch (node.type) {
      case 'service':
        return 'S';
      case 'app':
        return 'A';
      case 'library':
        return 'L';
    }
  }

  getNodeIconClass(node: ArchitectureNode): string {
    switch (node.type) {
      case 'service':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400';
      case 'app':
        return 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400';
      case 'library':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400';
    }
  }

  /** Check if the selected service node has HTTP transport */
  selectedServiceHasHttp(): boolean {
    const node = this.selectedNode();
    if (!node || node.type !== 'service') return false;
    const serviceNode = node as ServiceNode;
    return serviceNode.transports?.some((t) => t.type === 'http') ?? false;
  }

  /** Add HTTP transport to the selected service node */
  addHttpToSelectedService(): void {
    const node = this.selectedNode();
    if (!node || node.type !== 'service') return;

    const transport = createHttpTransport('/', 'v1');
    this.onAddTransport({ nodeId: node.id, transport });
  }

  /** Handle tab change from bottom panel */
  onBottomTabChanged(event: TabChange): void {
    console.log('Bottom tab changed:', event);
  }

  /** Handle add transport from bottom panel */
  onBottomPanelAddTransport(transportType: TransportType): void {
    const node = this.selectedNode();
    if (!node || node.type !== 'service') return;

    // Currently only HTTP is supported
    if (transportType === 'http') {
      const transport = createHttpTransport('/', 'v1');
      this.onAddTransport({ nodeId: node.id, transport });
    }
  }

  /** Handle add endpoint to a transport */
  onAddEndpoint(event: { nodeId: string; transportId: string; endpoint: HttpEndpoint }): void {
    this.architectureNodes.update((nodes) =>
      nodes.map((n) => {
        if (n.id === event.nodeId && n.type === 'service') {
          const serviceNode = n as ServiceNode;
          return {
            ...serviceNode,
            transports: serviceNode.transports?.map((t) => {
              if (t.id === event.transportId && t.type === 'http') {
                return {
                  ...t,
                  endpoints: [...t.endpoints, event.endpoint],
                };
              }
              return t;
            }),
          };
        }
        return n;
      }),
    );
    this.unsavedChanges.update((c) => c + 1);

    // Update transport config panel data if open
    const currentPanelData = this.transportConfigPanelData();
    if (currentPanelData && currentPanelData.nodeId === event.nodeId && currentPanelData.transport.id === event.transportId) {
      const updatedNode = this.architectureNodes().find((n) => n.id === event.nodeId) as ServiceNode | undefined;
      const updatedTransport = updatedNode?.transports?.find(
        (t) => t.type === 'http' && t.id === event.transportId
      ) as HttpTransport | undefined;

      if (updatedTransport) {
        this.transportConfigPanelData.set({
          ...currentPanelData,
          transport: updatedTransport,
        });
      }
    }
  }
}

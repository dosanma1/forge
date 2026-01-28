import { Component, computed, inject, signal } from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideFolderOpen,
  lucidePlus,
  lucideSearch,
  lucideSettings,
  lucidePlay,
} from '@ng-icons/lucide';
import {
  MmcButton,
  MmcIcon,
  MmcTabs,
  MmcTab,
  MmcAccordionPanel,
  MmcAccordionSection,
} from '@forge/ui';
import { ProjectService } from '../project/project.service';
import {
  FileTreeComponent,
  FileTreeNode,
} from '../../shared/components/file-tree/file-tree.component';
import { GraphEditorComponent, GraphNode, GraphEdge } from '../graph-editor';
import { ActionType } from '../graph-editor/models';

@Component({
  selector: 'app-architecture',
  standalone: true,
  imports: [
    FileTreeComponent,
    GraphEditorComponent,
    MmcButton,
    MmcIcon,
    MmcTabs,
    MmcTab,
    MmcAccordionPanel,
    MmcAccordionSection,
  ],
  viewProviders: [
    provideIcons({
      lucideFolderOpen,
      lucidePlus,
      lucideSearch,
      lucideSettings,
      lucidePlay,
    }),
  ],
  template: `
    <div class="grid grid-cols-[auto_1fr] grid-rows-[1fr_auto] h-full w-full">
      <!-- Left Panel - Architecture Explorer -->
      <aside
        class="col-start-1 row-start-1 row-span-2 w-64 border-r border-border bg-sidebar flex flex-col overflow-hidden"
      >
        <!-- Panel Header -->
        <div
          class="flex items-center justify-between px-3 py-2 border-b border-border"
        >
          <span class="text-sm font-semibold">Architecture</span>
          <div class="flex items-center gap-1">
            <button
              mmcButton
              variant="ghost"
              size="sm"
              title="Add new node"
              class="!p-1"
            >
              <mmc-icon name="lucidePlus" class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- Accordion Sections -->
        <mmc-accordion-panel
          [allowMultipleExpanded]="true"
          class="flex-1 min-h-0"
        >
          <!-- Recents Section -->
          <mmc-accordion-section id="recents" title="Recents" [expanded]="true">
            <div class="px-2 py-1">
              @if (recentNodes().length === 0) {
                <p class="text-xs text-muted-foreground p-2">No recent items</p>
              } @else {
                @for (node of recentNodes(); track node.id) {
                  <button
                    class="flex items-center gap-2 w-full px-2 py-1 text-xs rounded hover:bg-muted text-left"
                  >
                    <span
                      class="w-4 h-4 flex items-center justify-center text-primary"
                      >ƒ</span
                    >
                    <span class="truncate">{{ node.name }}</span>
                  </button>
                }
              }
            </div>
          </mmc-accordion-section>

          <!-- Graph Structure Section -->
          <mmc-accordion-section id="graph" title="Graph" [expanded]="true">
            @if (projectPath()) {
              <app-file-tree
                [directoryPath]="projectPath()"
                [hotReloadEnabled]="false"
                (fileSelect)="onFileSelect($event)"
                (directorySelect)="onDirectorySelect($event)"
                class="block h-full"
              />
            } @else {
              <div class="p-2">
                <button
                  mmcButton
                  variant="outline"
                  size="sm"
                  (click)="openFolder()"
                  class="w-full"
                >
                  <mmc-icon name="lucideFolderOpen" class="w-4 h-4 mr-2" />
                  Open Folder
                </button>
              </div>
            }
          </mmc-accordion-section>

          <!-- State Viewer Section -->
          <mmc-accordion-section
            id="state"
            title="State Viewer"
            [expanded]="false"
          >
            <div class="px-2 py-1">
              <p class="text-xs text-muted-foreground p-2">
                No state to display
              </p>
            </div>
          </mmc-accordion-section>
        </mmc-accordion-panel>
      </aside>

      <!-- Main Canvas Area -->
      <main class="col-start-2 row-start-1 overflow-hidden bg-muted/30">
        <app-graph-editor
          [graphNodes]="graphNodes()"
          [graphEdges]="graphEdges()"
          (nodesChanged)="onNodesChange($event)"
          (edgesChanged)="onEdgesChange($event)"
        />
      </main>

      <!-- Bottom Panel -->
      <div
        class="col-start-2 row-start-2 h-48 border-t border-border bg-background overflow-hidden"
      >
        <mmc-tabs
          [activeTabIndex]="0"
          variant="pill"
          class="h-full flex flex-col"
        >
          <mmc-tab name="Cards">
            <div class="p-4 overflow-auto h-full">
              <p class="text-sm text-muted-foreground">No cards to display</p>
            </div>
          </mmc-tab>
          <mmc-tab name="Logs">
            <div class="p-4 overflow-auto h-full font-mono text-xs">
              <p class="text-muted-foreground">No logs available</p>
            </div>
          </mmc-tab>
          <mmc-tab name="JSON">
            <div class="p-4 overflow-auto h-full">
              <pre class="text-xs font-mono">{{ graphJson() }}</pre>
            </div>
          </mmc-tab>
        </mmc-tabs>
      </div>
    </div>
  `,
  host: {
    class: 'flex flex-col h-full',
  },
})
export class ArchitectureComponent {
  private readonly projectService = inject(ProjectService);

  protected readonly projectPath = computed(() => {
    const project = this.projectService.selectedResource();
    return project?.path ?? null;
  });

  // Graph state
  protected readonly graphNodes = signal<GraphNode[]>([
    {
      id: 'start-1',
      name: 'Start',
      description: 'Entry point',
      type: 'start',
      positionX: 100,
      positionY: 200,
    },
    {
      id: 'node-1',
      name: 'Process Data',
      description: 'Process incoming data',
      type: 'standard',
      positionX: 400,
      positionY: 200,
      data: {
        actions: [
          {
            id: 'action-1',
            label: 'Validate input',
            type: ActionType.ExecuteCode,
          },
          {
            id: 'action-2',
            label: 'Transform data',
            type: ActionType.ExecuteCode,
          },
        ],
        options: [
          { id: 'option-1', label: 'Success' },
          { id: 'option-2', label: 'Error' },
        ],
      },
    },
  ]);

  protected readonly graphEdges = signal<GraphEdge[]>([
    {
      id: 'edge-1',
      source: 'start-1',
      target: 'node-1',
      targetHandle: 'node-node-1',
    },
  ]);

  protected readonly recentNodes = signal<GraphNode[]>([]);
  protected readonly unsavedChanges = signal<number>(0);

  protected readonly graphJson = computed(() => {
    return JSON.stringify(
      {
        nodes: this.graphNodes(),
        edges: this.graphEdges(),
      },
      null,
      2,
    );
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

  onNodesChange(nodes: GraphNode[]): void {
    this.graphNodes.set(nodes);
    this.unsavedChanges.update((c) => c + 1);
  }

  onEdgesChange(edges: GraphEdge[]): void {
    this.graphEdges.set(edges);
    this.unsavedChanges.update((c) => c + 1);
  }
}

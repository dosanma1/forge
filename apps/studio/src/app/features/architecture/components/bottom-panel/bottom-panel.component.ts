import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  viewChild,
} from '@angular/core';
import { MmcTabs, MmcTab } from '@forge/ui';
import { ActionsPanelComponent } from '../actions-panel/actions-panel.component';
import { TransportType } from '../transport-action/transport-action.component';
import { ArchitectureNode, HttpEndpoint } from '../../models/architecture-node.model';
import { TabChange } from '@forge/ui';

@Component({
  selector: 'app-bottom-panel',
  standalone: true,
  imports: [MmcTabs, MmcTab, ActionsPanelComponent],
  templateUrl: './bottom-panel.component.html',
  styleUrl: './bottom-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BottomPanelComponent {
  /** All architecture nodes */
  readonly nodes = input.required<ArchitectureNode[]>();

  /** Currently selected node */
  readonly selectedNode = input<ArchitectureNode | null>(null);

  /** ID of the selected node */
  readonly selectedNodeId = input<string | null>(null);

  /** Active tab index */
  readonly activeTabIndex = input<number>(0);

  /** JSON representation of the architecture */
  readonly architectureJson = input<string>('{}');

  /** Emitted when a node is selected */
  readonly selectNode = output<string>();

  /** Emitted when tab changes */
  readonly tabChanged = output<TabChange>();

  /** Emitted when a transport action is triggered */
  readonly addTransport = output<TransportType>();

  /** Emitted when an endpoint is added to a transport */
  readonly addEndpoint = output<{ nodeId: string; transportId: string; endpoint: HttpEndpoint }>();

  /** Reference to the tabs component for programmatic access */
  readonly tabs = viewChild<MmcTabs>('bottomTabs');

  protected onSelectNode(nodeId: string): void {
    this.selectNode.emit(nodeId);
  }

  protected onTabChanged(event: TabChange): void {
    this.tabChanged.emit(event);
  }

  protected onAddTransport(type: TransportType): void {
    this.addTransport.emit(type);
  }

  protected onAddEndpoint(event: { nodeId: string; transportId: string; endpoint: HttpEndpoint }): void {
    this.addEndpoint.emit(event);
  }

  /** Select a specific tab programmatically */
  selectTab(index: number): void {
    this.tabs()?.selectTab(index);
  }
}

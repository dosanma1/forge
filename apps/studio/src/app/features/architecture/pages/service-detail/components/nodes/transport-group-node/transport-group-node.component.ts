import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideGlobe, lucidePlus } from '@ng-icons/lucide';
import {
  CustomNodeComponent,
  DragHandleDirective,
  HandleComponent,
} from 'ngx-vflow';
import { MmcBadge, MmcIcon } from '@forge/ui';
import { HttpTransport } from '../../../../../models/architecture-node.model';
import { MethodBadgeComponent } from '../../../../../../../shared/components/method-badge/method-badge.component';
import { HandlerComponent } from '../../../../../../../shared/components/graph-editor/components/handler/handler.component';
import { TransportEditorService } from '../../../../../services/transport-editor.service';

export interface TransportGroupNodeData {
  transport: HttpTransport;
  nodeId: string; // Parent service node ID
}

@Component({
  selector: 'node-transport-group',
  standalone: true,
  imports: [
    DragHandleDirective,
    HandleComponent,
    MmcBadge,
    MmcIcon,
    MethodBadgeComponent,
    HandlerComponent,
  ],
  templateUrl: './transport-group-node.component.html',
  styleUrl: './transport-group-node.component.scss',
  viewProviders: [
    provideIcons({
      lucideGlobe,
      lucidePlus,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
  },
})
export class TransportGroupNodeComponent extends CustomNodeComponent<TransportGroupNodeData> {
  private readonly transportEditor = inject(TransportEditorService);

  protected readonly transport = computed(() => this.data()?.transport);
  protected readonly endpoints = computed(() => this.transport()?.endpoints ?? []);

  protected getTransportIcon(): string {
    // Currently only HTTP is supported
    return 'lucideGlobe';
  }

  protected getTransportLabel(): string {
    // Currently only HTTP is supported
    return 'HTTP';
  }

  /** Check if this transport is currently selected */
  protected isSelected(): boolean {
    const data = this.data();
    if (!data) return false;
    return this.transportEditor.isSelected(data.nodeId, data.transport.id);
  }

  /** Handle click on the transport card to select it */
  protected onTransportClick(event: Event): void {
    event.stopPropagation();
    const data = this.data();
    if (data) {
      this.transportEditor.selectTransport(data.nodeId, data.transport.id);
    }
  }

  /** Handle add endpoint click - select the transport to show the config panel */
  protected onAddEndpoint(event: Event): void {
    event.stopPropagation();
    const data = this.data();
    if (data) {
      this.transportEditor.selectTransport(data.nodeId, data.transport.id);
    }
  }
}

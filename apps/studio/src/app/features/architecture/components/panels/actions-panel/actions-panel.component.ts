import {
  Component,
  ChangeDetectionStrategy,
  inject,
  input,
  output,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import { lucideGlobe, lucideServer, lucideRadio, lucidePlus, lucideX } from '@ng-icons/lucide';
import { MmcButton, MmcIcon, MmcInput, SelectComponent, OptionComponent } from '@forge/ui';
import { TransportActionComponent, TransportType } from '../../actions/transport-action/transport-action.component';
import { ArchitectureNode, ServiceNode, HttpTransport, HttpMethod, HttpEndpoint, createHttpEndpoint } from '../../../models/architecture-node.model';
import { TransportEditorService } from '../../../services/transport-editor.service';

export interface TransportActionConfig {
  type: TransportType;
  label: string;
  icon: string;
  disabled: boolean;
}

@Component({
  selector: 'app-actions-panel',
  standalone: true,
  imports: [
    FormsModule,
    TransportActionComponent,
    MmcButton,
    MmcIcon,
    MmcInput,
    SelectComponent,
    OptionComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideGlobe,
      lucideServer,
      lucideRadio,
      lucidePlus,
      lucideX,
    }),
  ],
  templateUrl: './actions-panel.component.html',
  styleUrl: './actions-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ActionsPanelComponent {
  private readonly transportEditor = inject(TransportEditorService);

  /** Currently selected node */
  readonly selectedNode = input<ArchitectureNode | null>(null);

  /** Emitted when user wants to add a transport */
  readonly addTransport = output<TransportType>();

  /** Emitted when user wants to add an endpoint to a transport */
  readonly addEndpoint = output<{ nodeId: string; transportId: string; endpoint: HttpEndpoint }>();

  /** Available transport actions for service nodes */
  protected readonly transportActions: TransportActionConfig[] = [
    { type: 'http', label: 'HTTP', icon: 'lucideGlobe', disabled: false },
    { type: 'grpc', label: 'gRPC', icon: 'lucideServer', disabled: true },
    { type: 'nats', label: 'NATS', icon: 'lucideRadio', disabled: true },
  ];

  /** New endpoint form state */
  protected newEndpointMethod: HttpMethod = 'GET';
  protected newEndpointPath = '';

  /** Get the selected transport selection from service */
  protected readonly transportSelection = computed(() => this.transportEditor.selectedTransport());

  /** Get the selected transport object */
  protected readonly selectedTransport = computed<HttpTransport | null>(() => {
    const selection = this.transportSelection();
    const node = this.selectedNode();
    if (!selection || !node || node.type !== 'service') return null;

    const serviceNode = node as ServiceNode;
    return serviceNode.transports?.find(
      (t): t is HttpTransport => t.type === 'http' && t.id === selection.transportId
    ) ?? null;
  });

  protected onAddTransport(type: TransportType): void {
    this.addTransport.emit(type);
  }

  protected onAddEndpoint(): void {
    const selection = this.transportSelection();
    if (!selection || !this.newEndpointPath.trim()) return;

    const endpoint = createHttpEndpoint(
      this.newEndpointMethod,
      this.newEndpointPath.trim(),
      `handle${this.newEndpointMethod}${this.newEndpointPath.replace(/[^a-zA-Z]/g, '')}`
    );

    this.addEndpoint.emit({
      nodeId: selection.nodeId,
      transportId: selection.transportId,
      endpoint,
    });

    // Reset form
    this.newEndpointMethod = 'GET';
    this.newEndpointPath = '';
  }

  protected onClearSelection(): void {
    this.transportEditor.clearSelection();
  }
}

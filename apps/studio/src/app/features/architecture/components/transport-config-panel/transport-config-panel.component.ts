import {
  Component,
  ChangeDetectionStrategy,
  input,
  output,
  computed,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import {
  lucideGlobe,
  lucideX,
  lucideTrash,
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
  HttpTransport,
  HttpEndpoint,
  HttpMethod,
  createHttpEndpoint,
} from '../../models/architecture-node.model';
import { ViewportService, ViewportData } from '../../../../shared/services/viewport.service';
import { MethodBadgeComponent } from '../../../../shared/components/node/components/method-badge/method-badge.component';

export interface TransportConfigPanelData {
  nodeId: string;
  nodeName: string;
  transport: HttpTransport;
  position: { x: number; y: number };
}

@Component({
  selector: 'app-transport-config-panel',
  standalone: true,
  imports: [
    FormsModule,
    MmcButton,
    MmcIcon,
    MmcInput,
    MmcLabel,
    SelectComponent,
    OptionComponent,
    MethodBadgeComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideGlobe,
      lucideX,
      lucideTrash,
      lucidePlus,
    }),
  ],
  templateUrl: './transport-config-panel.component.html',
  styleUrl: './transport-config-panel.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TransportConfigPanelComponent {
  private readonly viewportService = inject(ViewportService);

  /** Panel configuration data */
  readonly data = input<TransportConfigPanelData | null>(null);

  /** Viewport for positioning (pan/zoom) */
  readonly viewport = input<ViewportData>({ x: 0, y: 0, zoom: 1 });

  /** Emitted when the user closes the panel */
  readonly close = output<void>();

  /** Emitted when the user adds an endpoint */
  readonly addEndpoint = output<{
    nodeId: string;
    transportId: string;
    endpoint: HttpEndpoint;
  }>();

  /** Emitted when the user changes the base path */
  readonly basePathChange = output<{
    nodeId: string;
    transportId: string;
    basePath: string;
  }>();

  // Form state
  protected newEndpointMethod: HttpMethod = 'GET';
  protected newEndpointPath = '';

  protected readonly panelPosition = computed(() => {
    const d = this.data();
    if (!d) return { x: 0, y: 0 };
    return this.viewportService.calculatePanelPosition(d.position, this.viewport());
  });

  protected onClose(): void {
    this.close.emit();
  }

  protected onBasePathChange(basePath: string): void {
    const d = this.data();
    if (!d) return;

    this.basePathChange.emit({
      nodeId: d.nodeId,
      transportId: d.transport.id,
      basePath,
    });
  }

  protected onAddEndpoint(): void {
    const d = this.data();
    if (!d || !this.newEndpointPath.trim()) return;

    const endpoint = createHttpEndpoint(
      this.newEndpointMethod,
      this.newEndpointPath.trim(),
      `handle${this.newEndpointMethod}${this.newEndpointPath.replace(/[^a-zA-Z]/g, '')}`,
    );

    this.addEndpoint.emit({
      nodeId: d.nodeId,
      transportId: d.transport.id,
      endpoint,
    });

    // Reset form
    this.newEndpointMethod = 'GET';
    this.newEndpointPath = '';
  }
}

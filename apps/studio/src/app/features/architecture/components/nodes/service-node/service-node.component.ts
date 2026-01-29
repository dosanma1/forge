import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideServer, lucideGlobe, lucideArrowRight, lucidePlus } from '@ng-icons/lucide';
import {
  CustomNodeComponent,
  DragHandleDirective,
  HandleComponent,
  SelectableDirective,
} from 'ngx-vflow';
import { cn, MmcBadge, MmcIcon } from '@forge/ui';
import { HandlerComponent } from '../../../../graph-editor/components/handler/handler.component';
import { NodeTagsComponent } from '../../node-tags/node-tags.component';
import { MethodBadgeComponent } from '../../../../../shared/components/node/components/method-badge/method-badge.component';
import { ServiceNode, HttpTransport } from '../../../models/architecture-node.model';
import { TransportEditorService } from '../../../services/transport-editor.service';
import { ClassValue } from 'clsx';
import { NodeMetadataService } from '../../../../../shared/components/node/services/node-metadata.service';

@Component({
  selector: 'node-service',
  templateUrl: './service-node.component.html',
  styleUrl: './service-node.component.scss',
  imports: [
    DragHandleDirective,
    HandleComponent,
    MmcBadge,
    MmcIcon,
    HandlerComponent,
    NodeTagsComponent,
    MethodBadgeComponent,
  ],
  hostDirectives: [SelectableDirective],
  viewProviders: [
    provideIcons({
      lucideServer,
      lucideGlobe,
      lucideArrowRight,
      lucidePlus,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-node-id]': 'data()?.id',
    '[class]': 'classNames()',
  },
})
export class ServiceNodeComponent extends CustomNodeComponent<ServiceNode> {
  private readonly transportEditor = inject(TransportEditorService);
  private readonly metadataService = inject(NodeMetadataService);

  readonly additionalClasses = input<ClassValue>('', {
    alias: 'class',
  });

  protected classNames = computed(() =>
    cn('contents', this.additionalClasses()),
  );

  protected getLanguageBadge(): string {
    const language = this.data()?.language;
    return language ? this.metadataService.getServiceLanguageLabel(language) : 'Go';
  }

  protected getDeployerLabel(): string {
    const deployer = this.data()?.deployer;
    return deployer ? this.metadataService.getDeployerLabel(deployer) : 'Helm/GKE';
  }

  /** Get HTTP transports from the service */
  protected readonly httpTransports = computed(() => {
    const transports = this.data()?.transports ?? [];
    return transports.filter((t): t is HttpTransport => t.type === 'http');
  });

  /** Check if service has any transports */
  protected readonly hasTransports = computed(() => {
    return (this.data()?.transports?.length ?? 0) > 0;
  });

  /** Check if a transport is selected */
  protected isTransportSelected(transportId: string): boolean {
    const nodeId = this.data()?.id;
    if (!nodeId) return false;
    return this.transportEditor.isSelected(nodeId, transportId);
  }

  /** Handle transport card click */
  protected onTransportClick(event: Event, transportId: string): void {
    event.stopPropagation(); // Prevent node selection
    const nodeId = this.data()?.id;
    if (!nodeId) return;
    this.transportEditor.selectTransport(nodeId, transportId);
  }
}

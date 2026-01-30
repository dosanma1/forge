import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import {
  lucideServer,
  lucideGlobe,
  lucideArrowRight,
  lucidePlus,
} from '@ng-icons/lucide';
import { CustomNodeComponent, SelectableDirective } from 'ngx-vflow';
import { cn, MmcIcon } from '@forge/ui';
import { MethodBadgeComponent } from '../../../../../shared/components/method-badge/method-badge.component';
import {
  ServiceNode,
  HttpTransport,
} from '../../../models/architecture-node.model';
import { TransportEditorService } from '../../../services/transport-editor.service';
import { CanvasNavigationService } from '../../../services/canvas-navigation.service';
import { ClassValue } from 'clsx';
import { ArchitectureMetadataService } from '../../../services/architecture-metadata.service';
import { BaseNodeComponent } from '../../../../../shared/components/graph-editor/components/base-node/base-node.component';

@Component({
  selector: 'node-service',
  templateUrl: './service-node.component.html',
  styleUrl: './service-node.component.scss',
  standalone: true,
  imports: [BaseNodeComponent, MmcIcon, MethodBadgeComponent],
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
  private readonly metadataService = inject(ArchitectureMetadataService);
  private readonly canvasNavigation = inject(CanvasNavigationService);

  readonly additionalClasses = input<ClassValue>('', { alias: 'class' });

  protected classNames = computed(() =>
    cn('contents', this.additionalClasses()),
  );

  protected getLanguageBadge(): string {
    const language = this.data()?.language;
    return language
      ? this.metadataService.getServiceLanguageLabel(language)
      : 'Go';
  }

  protected getDeployerLabel(): string {
    const deployer = this.data()?.deployer;
    return deployer
      ? this.metadataService.getDeployerLabel(deployer)
      : 'Helm/GKE';
  }

  /** Get HTTP transports from the service */
  protected readonly httpTransports = computed(() => {
    const transports = this.data()?.transports ?? [];
    return transports.filter((t): t is HttpTransport => t.type === 'http');
  });

  /** Check if a transport is selected */
  protected isTransportSelected(transportId: string): boolean {
    const nodeId = this.data()?.id;
    if (!nodeId) return false;
    return this.transportEditor.isSelected(nodeId, transportId);
  }

  /** Handle transport card click */
  protected onTransportClick(event: Event, transportId: string): void {
    event.stopPropagation();
    const nodeId = this.data()?.id;
    if (!nodeId) return;
    this.transportEditor.selectTransport(nodeId, transportId);
  }

  /** Handle double-click to drill into service internals (Canvas Level 2) */
  protected onDoubleClick(): void {
    const serviceNode = this.data();
    if (serviceNode) {
      this.canvasNavigation.drillIntoService(serviceNode.id, serviceNode);
    }
  }
}

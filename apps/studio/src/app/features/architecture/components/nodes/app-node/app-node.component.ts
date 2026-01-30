import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideMonitor } from '@ng-icons/lucide';
import { CustomNodeComponent, SelectableDirective } from 'ngx-vflow';
import { cn } from '@forge/ui';
import { AppNode } from '../../../models/architecture-node.model';
import { ClassValue } from 'clsx';
import { ArchitectureMetadataService } from '../../../services/architecture-metadata.service';
import { BaseNodeComponent } from '../../../../../shared/components/graph-editor/components/base-node/base-node.component';

@Component({
  selector: 'node-app',
  templateUrl: './app-node.component.html',
  styleUrl: './app-node.component.scss',
  standalone: true,
  imports: [BaseNodeComponent],
  hostDirectives: [SelectableDirective],
  viewProviders: [provideIcons({ lucideMonitor })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-node-id]': 'data()?.id',
    '[class]': 'classNames()',
  },
})
export class AppNodeComponent extends CustomNodeComponent<AppNode> {
  private readonly metadataService = inject(ArchitectureMetadataService);

  readonly additionalClasses = input<ClassValue>('', { alias: 'class' });

  protected classNames = computed(() =>
    cn('contents', this.additionalClasses()),
  );

  protected getFrameworkBadge(): string {
    const framework = this.data()?.framework;
    return framework
      ? this.metadataService.getAppFrameworkLabel(framework)
      : 'App';
  }

  protected getDeployerLabel(): string {
    const deployer = this.data()?.deployer;
    return deployer ? this.metadataService.getDeployerLabel(deployer) : 'N/A';
  }
}

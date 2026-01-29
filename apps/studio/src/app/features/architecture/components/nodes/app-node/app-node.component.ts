import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucideMonitor } from '@ng-icons/lucide';
import {
  CustomNodeComponent,
  DragHandleDirective,
  HandleComponent,
  SelectableDirective,
} from 'ngx-vflow';
import { cn, MmcBadge, MmcIcon } from '@forge/ui';
import { HandlerComponent } from '../../../../graph-editor/components/handler/handler.component';
import { NodeTagsComponent } from '../../node-tags/node-tags.component';
import { AppNode } from '../../../models/architecture-node.model';
import { ClassValue } from 'clsx';
import { NodeMetadataService } from '../../../../../shared/components/node/services/node-metadata.service';

@Component({
  selector: 'node-app',
  templateUrl: './app-node.component.html',
  styleUrl: './app-node.component.scss',
  imports: [
    DragHandleDirective,
    HandleComponent,
    MmcBadge,
    MmcIcon,
    HandlerComponent,
    NodeTagsComponent,
  ],
  hostDirectives: [SelectableDirective],
  viewProviders: [
    provideIcons({
      lucideMonitor,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-node-id]': 'data()?.id',
    '[class]': 'classNames()',
  },
})
export class AppNodeComponent extends CustomNodeComponent<AppNode> {
  private readonly metadataService = inject(NodeMetadataService);

  readonly additionalClasses = input<ClassValue>('', {
    alias: 'class',
  });

  protected classNames = computed(() =>
    cn('contents', this.additionalClasses()),
  );

  protected getFrameworkBadge(): string {
    const framework = this.data()?.framework;
    return framework ? this.metadataService.getAppFrameworkLabel(framework) : 'App';
  }

  protected getDeployerLabel(): string {
    const deployer = this.data()?.deployer;
    return deployer ? this.metadataService.getDeployerLabel(deployer) : 'N/A';
  }
}

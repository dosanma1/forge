import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucidePackage } from '@ng-icons/lucide';
import {
  CustomNodeComponent,
  DragHandleDirective,
  HandleComponent,
  SelectableDirective,
} from 'ngx-vflow';
import { cn, MmcBadge, MmcIcon } from '@forge/ui';
import { HandlerComponent } from '../../../../graph-editor/components/handler/handler.component';
import { NodeTagsComponent } from '../../node-tags/node-tags.component';
import { LibraryNode } from '../../../models/architecture-node.model';
import { ClassValue } from 'clsx';
import { NodeMetadataService } from '../../../../../shared/components/node/services/node-metadata.service';

@Component({
  selector: 'node-library',
  templateUrl: './library-node.component.html',
  styleUrl: './library-node.component.scss',
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
      lucidePackage,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-node-id]': 'data()?.id',
    '[class]': 'classNames()',
  },
})
export class LibraryNodeComponent extends CustomNodeComponent<LibraryNode> {
  private readonly metadataService = inject(NodeMetadataService);

  readonly additionalClasses = input<ClassValue>('', {
    alias: 'class',
  });

  protected classNames = computed(() =>
    cn('contents', this.additionalClasses()),
  );

  protected getLanguageBadge(): string {
    const language = this.data()?.language;
    return language ? this.metadataService.getLibraryLanguageLabel(language) : 'TypeScript';
  }
}

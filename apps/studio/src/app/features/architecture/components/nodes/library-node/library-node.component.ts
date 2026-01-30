import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucidePackage } from '@ng-icons/lucide';
import { CustomNodeComponent, SelectableDirective } from 'ngx-vflow';
import { cn } from '@forge/ui';
import { LibraryNode } from '../../../models/architecture-node.model';
import { ClassValue } from 'clsx';
import { ArchitectureMetadataService } from '../../../services/architecture-metadata.service';
import { BaseNodeComponent } from '../../../../../shared/components/graph-editor/components/base-node/base-node.component';

@Component({
  selector: 'node-library',
  templateUrl: './library-node.component.html',
  styleUrl: './library-node.component.scss',
  standalone: true,
  imports: [BaseNodeComponent],
  hostDirectives: [SelectableDirective],
  viewProviders: [provideIcons({ lucidePackage })],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[attr.data-node-id]': 'data()?.id',
    '[class]': 'classNames()',
  },
})
export class LibraryNodeComponent extends CustomNodeComponent<LibraryNode> {
  private readonly metadataService = inject(ArchitectureMetadataService);

  readonly additionalClasses = input<ClassValue>('', { alias: 'class' });

  protected classNames = computed(() =>
    cn('contents', this.additionalClasses()),
  );

  protected getLanguageBadge(): string {
    const language = this.data()?.language;
    return language
      ? this.metadataService.getLibraryLanguageLabel(language)
      : 'TypeScript';
  }
}

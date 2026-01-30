import {
  ChangeDetectionStrategy,
  Component,
  computed,
  output,
} from '@angular/core';
import { provideIcons } from '@ng-icons/core';
import { lucidePackage, lucidePlus } from '@ng-icons/lucide';
import {
  CustomNodeComponent,
  DragHandleDirective,
  HandleComponent,
} from 'ngx-vflow';
import { MmcBadge, MmcIcon } from '@forge/ui';
import { HandlerComponent } from '../../../../../../../shared/components/graph-editor/components/handler/handler.component';

export interface ResourceMethod {
  id: string;
  name: string;
  params: string;
  returns: string;
  isCustom?: boolean;
}

export interface ResourceCardNodeData {
  id: string;
  name: string;
  basePath: string;
  version: string;
  methods: ResourceMethod[];
}

@Component({
  selector: 'node-resource-card',
  standalone: true,
  imports: [
    DragHandleDirective,
    HandleComponent,
    MmcBadge,
    MmcIcon,
    HandlerComponent,
  ],
  templateUrl: './resource-card-node.component.html',
  styleUrl: './resource-card-node.component.scss',
  viewProviders: [
    provideIcons({
      lucidePackage,
      lucidePlus,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'contents',
  },
})
export class ResourceCardNodeComponent extends CustomNodeComponent<ResourceCardNodeData> {
  /** Event emitted when add method is clicked */
  readonly addMethodClick = output<string>();

  protected readonly resource = computed(() => this.data());
  protected readonly methods = computed(() => this.data()?.methods ?? []);

  protected onAddMethod(event: Event): void {
    event.stopPropagation();
    const data = this.data();
    if (data) {
      this.addMethodClick.emit(data.id);
    }
  }
}

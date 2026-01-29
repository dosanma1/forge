import {
  Component,
  ChangeDetectionStrategy,
  inject,
  signal,
  computed,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { provideIcons } from '@ng-icons/core';
import {
  lucideServer,
  lucideMonitor,
  lucidePackage,
} from '@ng-icons/lucide';
import {
  MmcButton,
  MmcIcon,
  MmcInput,
  MmcLabel,
  SelectComponent,
  OptionComponent,
  MmcDrawerRef,
  DRAWER_DATA,
} from '@forge/ui';
import {
  ArchitectureNodeType,
  ServiceLanguage,
  ServiceDeployer,
  AppFramework,
  AppDeployer,
  LibraryLanguage,
  ArchitectureNode,
  createServiceNode,
  createAppNode,
  createLibraryNode,
} from '../../models/architecture-node.model';

export interface AddNodeDrawerData {
  type: ArchitectureNodeType;
  position: { x: number; y: number };
}

export interface AddNodeDrawerResult {
  node: ArchitectureNode;
}

@Component({
  selector: 'app-add-node-drawer',
  standalone: true,
  imports: [
    FormsModule,
    MmcButton,
    MmcIcon,
    MmcInput,
    MmcLabel,
    SelectComponent,
    OptionComponent,
  ],
  viewProviders: [
    provideIcons({
      lucideServer,
      lucideMonitor,
      lucidePackage,
    }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './add-node-drawer.component.html',
  styleUrl: './add-node-drawer.component.scss',
})
export class AddNodeDrawerComponent {
  private readonly drawerRef = inject(MmcDrawerRef<AddNodeDrawerResult>);
  protected readonly data = signal(inject<AddNodeDrawerData>(DRAWER_DATA));

  // Form state
  protected name = '';
  protected serviceLanguage: ServiceLanguage = 'go';
  protected serviceDeployer: ServiceDeployer = 'helm';
  protected appFramework: AppFramework = 'angular';
  protected appDeployer: AppDeployer = 'firebase';
  protected libraryLanguage: LibraryLanguage = 'go';

  protected nodeTypeLabel = computed(() => {
    switch (this.data().type) {
      case 'service':
        return 'Service';
      case 'app':
        return 'Application';
      case 'library':
        return 'Library';
    }
  });

  protected headerIcon = computed(() => {
    switch (this.data().type) {
      case 'service':
        return 'lucideServer';
      case 'app':
        return 'lucideMonitor';
      case 'library':
        return 'lucidePackage';
    }
  });

  protected headerColorClass = computed(() => {
    switch (this.data().type) {
      case 'service':
        return 'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400';
      case 'app':
        return 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400';
      case 'library':
        return 'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400';
    }
  });

  protected previewRootPath = computed(() => {
    const kebabName = this.name.toLowerCase().replace(/\s+/g, '-') || 'name';
    switch (this.data().type) {
      case 'service':
        return `backend/services/${kebabName}`;
      case 'app':
        return `frontend/apps/${kebabName}`;
      case 'library':
        return `shared/${kebabName}`;
    }
  });

  protected isValid(): boolean {
    return this.name.trim().length > 0;
  }

  protected onCancel(): void {
    this.drawerRef.close();
  }

  protected onSubmit(): void {
    if (!this.isValid()) return;

    const kebabName = this.name.toLowerCase().replace(/\s+/g, '-');
    const position = this.data().position;

    let node: ArchitectureNode;

    switch (this.data().type) {
      case 'service':
        node = createServiceNode(
          kebabName,
          this.serviceLanguage,
          this.serviceDeployer,
          position,
        );
        break;
      case 'app':
        node = createAppNode(
          kebabName,
          this.appFramework,
          this.appDeployer,
          position,
        );
        break;
      case 'library':
        node = createLibraryNode(kebabName, this.libraryLanguage, position);
        break;
    }

    this.drawerRef.close({ node });
  }
}

import { Provider } from '@angular/core';
import { NODE_TYPE_COMPONENTS } from '../../shared/components/graph-editor/node-type-registry';
import { ServiceNodeComponent } from './components/nodes/service-node/service-node.component';
import { AppNodeComponent } from './components/nodes/app-node/app-node.component';
import { LibraryNodeComponent } from './components/nodes/library-node/library-node.component';

/**
 * Providers for the architecture feature's node type components.
 * This registers the concrete node component implementations with the graph editor.
 */
export const ARCHITECTURE_NODE_PROVIDERS: Provider[] = [
  {
    provide: NODE_TYPE_COMPONENTS,
    useValue: {
      service: ServiceNodeComponent,
      app: AppNodeComponent,
      library: LibraryNodeComponent,
    },
  },
];

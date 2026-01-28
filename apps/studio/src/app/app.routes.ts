import { Routes } from '@angular/router';
import { LayoutComponent } from './core/layout/layout.component';
import { SETTINGS_ROUTES } from './features/settings/settings.routes';
import { PROJECT_ROUTES } from './features/project/project.routes';
import { projectSelectedGuard } from './features/project/guards/project-selected.guard';

export const routes: Routes = [
  {
    path: 'vflow-test',
    loadComponent: () =>
      import('./features/vflow-test/vflow-test.component').then(
        (m) => m.VflowTestComponent
      ),
  },
  ...PROJECT_ROUTES,
  ...SETTINGS_ROUTES,
  {
    path: '',
    component: LayoutComponent,
    canActivateChild: [projectSelectedGuard],
    loadChildren: () =>
      import('./core/layout/layout.routes').then((r) => r.LAYOUT_ROUTES),
  },
];

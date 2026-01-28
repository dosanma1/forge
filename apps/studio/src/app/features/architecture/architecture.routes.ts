import { Routes } from '@angular/router';

export const ARCHITECTURE_ROUTES: Routes = [
  {
    path: 'architecture',
    loadComponent: () =>
      import('./architecture.component').then((m) => m.ArchitectureComponent),
  },
];

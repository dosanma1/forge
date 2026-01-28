import { Routes } from '@angular/router';
import { ARCHITECTURE_ROUTES } from '../../features/architecture/architecture.routes';
import { NOT_FOUND_ROUTES } from '../../features/not-found/not-found.routes';
import { MenuRoute } from '../navigation/navigation-menu';

export const LAYOUT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: MenuRoute.ARCHITECTURE },
  ...ARCHITECTURE_ROUTES,
  ...NOT_FOUND_ROUTES,
];

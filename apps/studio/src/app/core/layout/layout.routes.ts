import { Routes } from '@angular/router';
import { DASHBOARD_ROUTES } from '../../features/dashboard/dashboard.routes';
import { NOT_FOUND_ROUTES } from '../../features/not-found/not-found.routes';
import { MenuRoute } from '../navigation/navigation-menu';

export const LAYOUT_ROUTES: Routes = [
  { path: '', pathMatch: 'full', redirectTo: MenuRoute.DASHBOARD },
  ...DASHBOARD_ROUTES,
  ...NOT_FOUND_ROUTES,
];

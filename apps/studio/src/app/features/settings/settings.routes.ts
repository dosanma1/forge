import { Routes } from '@angular/router';
import { Path } from '../../core/navigation/navigation-menu';
import { projectSelectedGuard } from '../project/guards/project-selected.guard';

export const SETTINGS_ROUTES: Routes = [
  {
    path: Path.SETTINGS,

    canActivateChild: [projectSelectedGuard],
    loadComponent: () =>
      import('./settings.component').then((m) => m.SettingsComponent),
    children: [
      {
        path: '',
        pathMatch: 'full',
        redirectTo: `${Path.ACCOUNTS}`,
      },
      {
        path: Path.ACCOUNTS,
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: `${Path.PREFERENCES}`,
          },
          {
            path: Path.PREFERENCES,
            loadComponent: () =>
              import('./pages/preferences/preferences.component').then(
                (m) => m.PreferencesComponent,
              ),
          },
        ],
      },
      {
        path: Path.PROJECT,
        children: [
          {
            path: '',
            pathMatch: 'full',
            redirectTo: `${Path.GENERAL}`,
          },
          {
            path: Path.GENERAL,
            loadComponent: () =>
              import('./pages/general/general.component').then(
                (m) => m.GeneralComponent,
              ),
          },
        ],
      },
    ],
  },
];

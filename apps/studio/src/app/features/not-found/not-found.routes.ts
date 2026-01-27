import { Routes } from '@angular/router';
import { Breadcrumbs } from '@forge/ui';

export const NOT_FOUND_ROUTES: Routes = [
	{
		path: '**',
		pathMatch: 'full',
		data: {
			[Breadcrumbs]: null,
		},
		loadComponent: () =>
			import('./not-found.component').then((m) => m.NotFoundComponent),
	},
];

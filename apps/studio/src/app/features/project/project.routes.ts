import { Routes } from '@angular/router';
import { Path } from '../../core/navigation/navigation-menu';

export const PROJECT_ROUTES: Routes = [
	{
		path: Path.PROJECTS,

		loadComponent: () =>
			import('./project.component').then((m) => m.ProjectComponent),
	},
	{
		path: `${Path.PROJECTS}/${Path.JOIN}`,

		loadComponent: () =>
			import('./create-project/create-project.component').then(
				(m) => m.CreateProjectComponent,
			),
	},
];

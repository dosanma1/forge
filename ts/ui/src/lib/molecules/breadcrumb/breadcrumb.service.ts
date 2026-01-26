import { inject, Injectable, signal } from '@angular/core';
import {
	ActivatedRouteSnapshot,
	Data,
	NavigationEnd,
	Router,
} from '@angular/router';
import { LogService } from 'log';
import { filter } from 'rxjs';
import { Breadcrumb } from './breadcrumb.component';

export const Breadcrumbs = 'breadcrumbs';

@Injectable({
	providedIn: 'root',
})
export class MmcBreadcrumbService {
	private readonly router = inject(Router);
	private readonly logger = inject(LogService);

	public readonly breadcrumb = signal<Breadcrumb[]>([]);

	constructor() {
		this.router.events
			.pipe(
				// Filter the NavigationEnd events as the breadcrumb is updated only when the route reaches its end
				filter((event) => event instanceof NavigationEnd),
			)
			.subscribe((event) => {
				// Construct the breadcrumb hierarchy
				const root = this.router.routerState.snapshot.root;
				const breadcrumbs: Breadcrumb[] = [];
				this.addBreadcrumb(root, [], breadcrumbs);

				// Emit the new hierarchy
				this.breadcrumb.set(breadcrumbs);
			});
	}

	private addBreadcrumb(
		route: ActivatedRouteSnapshot,
		parentUrl: string[],
		breadcrumbs: Breadcrumb[],
	) {
		if (route) {
			// Construct the route URL
			const routeUrl = parentUrl.concat(route.url.map((url) => url.path));

			// Add an element for the current route part
			if (route.data[Breadcrumbs]) {
				const breadcrumb = {
					label: this.getLabel(route.data),
					url: '/' + routeUrl.join('/'),
				};
				breadcrumbs.push(breadcrumb);
				this.logger.debug(`${Breadcrumbs}: `, breadcrumb);
			}

			// Add another element for the next route part
			this.addBreadcrumb(route.firstChild, routeUrl, breadcrumbs);
		}
	}

	private getLabel(data: Data) {
		// The breadcrumb can be defined as a static string or as a function to construct the breadcrumb element out of the route data
		return typeof data[Breadcrumbs] === 'function'
			? data[Breadcrumbs](data)
			: data[Breadcrumbs];
	}
}

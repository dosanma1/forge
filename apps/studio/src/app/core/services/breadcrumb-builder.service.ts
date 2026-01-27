import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs';
import { MmcBreadcrumbService } from '@forge/ui';
import { MenuRoute, Path } from '../navigation/navigation-menu';

export interface BreadcrumbItem {
  label: string;
  url: string;
}

interface BreadcrumbConfig {
  [key: string]: {
    label: string;
    parent?: string;
  };
}

@Injectable({
  providedIn: 'root',
})
export class BreadcrumbBuilderService {
  private readonly router = inject(Router);
  private readonly breadcrumbService = inject(MmcBreadcrumbService);

  constructor() {
    // Listen for navigation events to handle redirects and maintain breadcrumbs
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        // Use setTimeout to ensure this runs after MmcBreadcrumbService
        setTimeout(() => {
          this.setBreadcrumbsForCurrentPage(event.url);
        }, 0);
      });
  }

  private readonly breadcrumbConfig: BreadcrumbConfig = {
    // Account settings
    [`${MenuRoute.SETTINGS}/${Path.ACCOUNTS}`]: {
      label: 'Account settings',
      parent: MenuRoute.SETTINGS,
    },
    [`${MenuRoute.SETTINGS}/${Path.ACCOUNTS}/${Path.PREFERENCES}`]: {
      label: 'Preferences',
      parent: `${MenuRoute.SETTINGS}/${Path.ACCOUNTS}`,
    },

    // Project settings
    [`${MenuRoute.SETTINGS}/${Path.PROJECT}`]: {
      label: 'Project settings',
      parent: MenuRoute.SETTINGS,
    },
    [`${MenuRoute.SETTINGS}/${Path.PROJECT}/${Path.GENERAL}`]: {
      label: 'General',
      parent: `${MenuRoute.SETTINGS}/${Path.PROJECT}`,
    },
  };

  /**
   * Sets breadcrumbs for the current page by building the full chain
   * from the current URL or provided URL
   */
  setBreadcrumbsForCurrentPage(currentUrl?: string): void {
    const url = currentUrl || this.router.url;
    const breadcrumbs = this.buildBreadcrumbChain(url);
    this.breadcrumbService.breadcrumb.set(breadcrumbs);
  }

  /**
   * Sets breadcrumbs with a dynamic item (like strategy name)
   */
  setBreadcrumbsWithDynamicItem(
    parentUrl: string,
    dynamicItem: BreadcrumbItem,
  ): void {
    const parentBreadcrumbs = this.buildBreadcrumbChain(parentUrl);
    const breadcrumbs = [...parentBreadcrumbs, dynamicItem];
    this.breadcrumbService.breadcrumb.set(breadcrumbs);
  }

  /**
   * Sets breadcrumbs by auto-detecting dynamic segments from current URL
   * and allows overriding specific segments with custom labels
   */
  setBreadcrumbsWithDynamicSegments(
    segmentLabels: { [segment: string]: string } = {},
  ): void {
    const url = this.router.url.split('?')[0].split('#')[0];
    const segments = url.split('/').filter((s) => s);
    const breadcrumbs: BreadcrumbItem[] = [];

    let currentPath = '';
    for (const segment of segments) {
      currentPath += `/${segment}`;

      // Check if we have a configured breadcrumb for this path
      const config = this.breadcrumbConfig[currentPath];
      if (config) {
        breadcrumbs.push({
          label: config.label,
          url: currentPath,
        });
      } else {
        // This is likely a dynamic segment, use provided label or capitalize segment
        const label = segmentLabels[segment] || this.capitalizeSegment(segment);
        breadcrumbs.push({
          label,
          url: currentPath,
        });
      }
    }

    this.breadcrumbService.breadcrumb.set(breadcrumbs);
  }

  /**
   * Capitalizes and formats a URL segment for display
   */
  private capitalizeSegment(segment: string): string {
    return segment
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  /**
   * Sets breadcrumbs with multiple dynamic items
   */
  setBreadcrumbsWithDynamicChain(
    parentUrl: string,
    dynamicItems: BreadcrumbItem[],
  ): void {
    const parentBreadcrumbs = this.buildBreadcrumbChain(parentUrl);
    const breadcrumbs = [...parentBreadcrumbs, ...dynamicItems];
    this.breadcrumbService.breadcrumb.set(breadcrumbs);
  }

  /**
   * Builds the full breadcrumb chain for a given URL
   */
  private buildBreadcrumbChain(url: string): BreadcrumbItem[] {
    const breadcrumbs: BreadcrumbItem[] = [];
    let currentUrl = url;

    // Remove query params and fragments
    currentUrl = currentUrl.split('?')[0].split('#')[0];

    // Build chain by walking up the hierarchy
    while (currentUrl && this.breadcrumbConfig[currentUrl]) {
      const config = this.breadcrumbConfig[currentUrl];
      breadcrumbs.unshift({
        label: config.label,
        url: currentUrl,
      });

      currentUrl = config.parent || '';
    }

    return breadcrumbs;
  }

  /**
   * Adds a new breadcrumb configuration dynamically
   */
  addBreadcrumbConfig(url: string, label: string, parent?: string): void {
    this.breadcrumbConfig[url] = { label, parent };
  }
}

import { Injectable } from '@angular/core';
import { HttpMethod } from '../../../../features/architecture/models/architecture-node.model';

/**
 * Style configuration for HTTP method badges
 */
export interface HttpMethodStyleConfig {
  /** Background and text color classes */
  badgeClass: string;
  /** Short display label */
  label: string;
  /** Full display label */
  labelFull: string;
}

/**
 * Service that provides styling for HTTP method badges.
 */
@Injectable({ providedIn: 'root' })
export class HttpMethodStyleService {
  /**
   * Style configurations for each HTTP method
   */
  private readonly methodStyles: Record<HttpMethod, HttpMethodStyleConfig> = {
    GET: {
      badgeClass:
        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/50 dark:text-emerald-400',
      label: 'GET',
      labelFull: 'GET',
    },
    POST: {
      badgeClass:
        'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-400',
      label: 'POST',
      labelFull: 'POST',
    },
    PUT: {
      badgeClass:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
      label: 'PUT',
      labelFull: 'PUT',
    },
    PATCH: {
      badgeClass:
        'bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400',
      label: 'PATCH',
      labelFull: 'PATCH',
    },
    DELETE: {
      badgeClass:
        'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400',
      label: 'DEL',
      labelFull: 'DELETE',
    },
  };

  /**
   * Default style for unknown methods
   */
  private readonly defaultStyle: HttpMethodStyleConfig = {
    badgeClass: 'bg-muted text-muted-foreground',
    label: '?',
    labelFull: 'Unknown',
  };

  /**
   * Get the full style configuration for an HTTP method
   */
  getStyle(method: string): HttpMethodStyleConfig {
    return (
      this.methodStyles[method as HttpMethod] ?? this.defaultStyle
    );
  }

  /**
   * Get badge class for an HTTP method
   */
  getMethodClass(method: string): string {
    return this.getStyle(method).badgeClass;
  }

  /**
   * Get short label for an HTTP method (e.g., "DEL" for DELETE)
   */
  getLabel(method: string): string {
    return this.getStyle(method).label;
  }

  /**
   * Get full label for an HTTP method
   */
  getLabelFull(method: string): string {
    return this.getStyle(method).labelFull;
  }

  /**
   * Get all supported HTTP methods
   */
  getAllMethods(): HttpMethod[] {
    return ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];
  }

  /**
   * Check if a method is a read operation (GET)
   */
  isReadMethod(method: string): boolean {
    return method === 'GET';
  }

  /**
   * Check if a method is a write operation (POST, PUT, PATCH, DELETE)
   */
  isWriteMethod(method: string): boolean {
    return ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
  }

  /**
   * Check if a method is destructive (DELETE)
   */
  isDestructiveMethod(method: string): boolean {
    return method === 'DELETE';
  }

  /**
   * Get methods grouped by type (for UI organization)
   */
  getMethodsByType(): { read: HttpMethod[]; write: HttpMethod[]; destructive: HttpMethod[] } {
    return {
      read: ['GET'],
      write: ['POST', 'PUT', 'PATCH'],
      destructive: ['DELETE'],
    };
  }
}

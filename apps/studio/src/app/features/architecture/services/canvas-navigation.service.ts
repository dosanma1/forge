import { Injectable, signal, computed } from '@angular/core';
import { ServiceNode } from '../models/architecture-node.model';

/**
 * Canvas view levels for drill-down navigation
 */
export type CanvasLevel = 'architecture' | 'service-internals';

/**
 * Service to manage canvas navigation state
 * Handles drill-down between Canvas Level 1 (Architecture Overview) and
 * Canvas Level 2 (Service Internals / Endpoint Designer)
 */
@Injectable({
  providedIn: 'root',
})
export class CanvasNavigationService {
  /** Current canvas level */
  private readonly _currentLevel = signal<CanvasLevel>('architecture');

  /** Currently focused service node (when in service-internals view) */
  private readonly _focusedServiceId = signal<string | null>(null);

  /** Currently focused service node data */
  private readonly _focusedService = signal<ServiceNode | null>(null);

  /** Public readonly access to current level */
  readonly currentLevel = this._currentLevel.asReadonly();

  /** Public readonly access to focused service ID */
  readonly focusedServiceId = this._focusedServiceId.asReadonly();

  /** Public readonly access to focused service data */
  readonly focusedService = this._focusedService.asReadonly();

  /** Check if we're in the service internals view */
  readonly isInServiceInternals = computed(() => this._currentLevel() === 'service-internals');

  /**
   * Drill down into a service node to show Canvas Level 2
   */
  drillIntoService(serviceId: string, serviceNode: ServiceNode): void {
    this._focusedServiceId.set(serviceId);
    this._focusedService.set(serviceNode);
    this._currentLevel.set('service-internals');
  }

  /**
   * Navigate back to Canvas Level 1 (Architecture Overview)
   */
  navigateBack(): void {
    this._currentLevel.set('architecture');
    this._focusedServiceId.set(null);
    this._focusedService.set(null);
  }

  /**
   * Update the focused service data (when it changes while in service-internals view)
   */
  updateFocusedService(serviceNode: ServiceNode): void {
    if (this._focusedServiceId() === serviceNode.id) {
      this._focusedService.set(serviceNode);
    }
  }
}

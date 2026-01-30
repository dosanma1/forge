import { Injectable, signal, computed } from '@angular/core';

/**
 * Viewport data representing the current pan/zoom state of the canvas.
 */
export interface ViewportData {
  /** X offset (pan) */
  x: number;
  /** Y offset (pan) */
  y: number;
  /** Zoom level (1 = 100%) */
  zoom: number;
}

/**
 * Position in 2D space
 */
export interface Position {
  x: number;
  y: number;
}

/**
 * Configuration for panel positioning
 */
export interface PanelPositionConfig {
  /** Width of the element the panel is positioned relative to */
  elementWidth?: number;
  /** Height of the element */
  elementHeight?: number;
  /** Gap between element and panel */
  gap?: number;
  /** Panel width for boundary calculations */
  panelWidth?: number;
  /** Panel height for boundary calculations */
  panelHeight?: number;
  /** Position panel on which side of the element */
  side?: 'left' | 'right' | 'top' | 'bottom';
}

/**
 * Service that manages viewport state and provides coordinate transformations.
 */
@Injectable({ providedIn: 'root' })
export class ViewportService {
  /**
   * Current viewport state (can be updated from ngx-vflow events)
   */
  private readonly _viewport = signal<ViewportData>({ x: 0, y: 0, zoom: 1 });

  /**
   * Public readonly access to viewport state
   */
  readonly viewport = this._viewport.asReadonly();

  /**
   * Current zoom level
   */
  readonly zoom = computed(() => this._viewport().zoom);

  /**
   * Current pan offset
   */
  readonly offset = computed(() => ({
    x: this._viewport().x,
    y: this._viewport().y,
  }));

  /**
   * Update the viewport state (typically called from ngx-vflow viewport change events)
   */
  updateViewport(data: ViewportData): void {
    this._viewport.set(data);
  }

  /**
   * Update only the zoom level
   */
  updateZoom(zoom: number): void {
    this._viewport.update((v) => ({ ...v, zoom }));
  }

  /**
   * Update only the pan offset
   */
  updateOffset(x: number, y: number): void {
    this._viewport.update((v) => ({ ...v, x, y }));
  }

  /**
   * Convert flow coordinates to screen coordinates.
   * Flow coordinates are the logical positions in the graph.
   * Screen coordinates are pixel positions on the viewport.
   */
  flowToScreen(flowPosition: Position, viewport?: ViewportData): Position {
    const vp = viewport ?? this._viewport();
    return {
      x: flowPosition.x * vp.zoom + vp.x,
      y: flowPosition.y * vp.zoom + vp.y,
    };
  }

  /**
   * Convert screen coordinates to flow coordinates.
   */
  screenToFlow(screenPosition: Position, viewport?: ViewportData): Position {
    const vp = viewport ?? this._viewport();
    return {
      x: (screenPosition.x - vp.x) / vp.zoom,
      y: (screenPosition.y - vp.y) / vp.zoom,
    };
  }

  /**
   * Calculate panel position relative to a node/element in flow coordinates.
   */
  calculatePanelPosition(
    flowPosition: Position,
    viewport?: ViewportData,
    config: PanelPositionConfig = {},
  ): Position {
    const vp = viewport ?? this._viewport();
    const { elementWidth = 260, gap = 16, side = 'right' } = config;

    // Calculate base position based on side
    let baseX = flowPosition.x;
    let baseY = flowPosition.y;

    switch (side) {
      case 'right':
        baseX = flowPosition.x + elementWidth + gap;
        break;
      case 'left':
        baseX = flowPosition.x - gap - (config.panelWidth ?? 288);
        break;
      case 'top':
        baseY = flowPosition.y - gap - (config.panelHeight ?? 200);
        break;
      case 'bottom':
        baseY = flowPosition.y + (config.elementHeight ?? 100) + gap;
        break;
    }

    // Transform to screen coordinates
    const screenX = baseX * vp.zoom + vp.x;
    const screenY = baseY * vp.zoom + vp.y;

    return { x: screenX, y: screenY };
  }

  /**
   * Create default viewport data
   */
  static createDefault(): ViewportData {
    return { x: 0, y: 0, zoom: 1 };
  }

  /**
   * Check if two viewports are equal
   */
  static isEqual(a: ViewportData, b: ViewportData): boolean {
    return a.x === b.x && a.y === b.y && a.zoom === b.zoom;
  }
}

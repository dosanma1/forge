import { Injectable } from '@angular/core';
import { NodeColorScheme, NodeStyleConfig } from '../models/node-styling.model';

/**
 * Service that provides centralized styling for graph nodes.
 * This service is feature-agnostic - it only knows about color schemes.
 * Features should map their node types to color schemes.
 */
@Injectable({ providedIn: 'root' })
export class NodeStyleService {
  /**
   * Style configurations for each color scheme.
   * Consolidated to ensure consistency across the application.
   */
  private readonly colorStyles: Record<NodeColorScheme, NodeStyleConfig> = {
    blue: {
      bgClass: 'bg-blue-50 dark:bg-blue-950/30',
      textClass: 'text-blue-700 dark:text-blue-300',
      borderClass: 'border-blue-200 dark:border-blue-800/50',
      badgeClass:
        'bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400 ring-blue-300 dark:ring-blue-700',
      ringClass: 'ring-blue-500',
      iconClass: 'text-blue-500',
    },
    green: {
      bgClass: 'bg-green-50 dark:bg-green-950/30',
      textClass: 'text-green-700 dark:text-green-300',
      borderClass: 'border-green-200 dark:border-green-800/50',
      badgeClass:
        'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400 ring-green-300 dark:ring-green-700',
      ringClass: 'ring-green-500',
      iconClass: 'text-green-500',
    },
    purple: {
      bgClass: 'bg-purple-50 dark:bg-purple-950/30',
      textClass: 'text-purple-700 dark:text-purple-300',
      borderClass: 'border-purple-200 dark:border-purple-800/50',
      badgeClass:
        'bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-400 ring-purple-300 dark:ring-purple-700',
      ringClass: 'ring-purple-500',
      iconClass: 'text-purple-500',
    },
    gray: {
      bgClass: 'bg-muted',
      textClass: 'text-muted-foreground',
      borderClass: 'border-border',
      badgeClass: 'bg-muted text-muted-foreground',
      ringClass: 'ring-muted',
      iconClass: 'text-muted-foreground',
    },
  };

  /**
   * Get the full style configuration for a color scheme.
   */
  getStylesByScheme(scheme: NodeColorScheme): NodeStyleConfig {
    return this.colorStyles[scheme] ?? this.colorStyles['gray'];
  }

  /**
   * Get header background class for a color scheme.
   */
  getHeaderBgClass(scheme: NodeColorScheme): string {
    const styles = this.getStylesByScheme(scheme);
    return `${styles.bgClass} ${styles.textClass}`;
  }

  /**
   * Get card header classes including border.
   */
  getCardHeaderClass(scheme: NodeColorScheme): string {
    const styles = this.getStylesByScheme(scheme);
    return `${styles.bgClass} ${styles.textClass} ${styles.borderClass}`;
  }

  /**
   * Get badge class for a color scheme.
   */
  getBadgeClass(scheme: NodeColorScheme): string {
    return this.getStylesByScheme(scheme).badgeClass;
  }

  /**
   * Get icon color class for a color scheme.
   */
  getIconClass(scheme: NodeColorScheme): string {
    return this.getStylesByScheme(scheme).iconClass;
  }

  /**
   * Get selection ring class for a color scheme.
   */
  getSelectionRingClass(scheme: NodeColorScheme): string {
    return this.getStylesByScheme(scheme).ringClass;
  }

  /**
   * Get border class for selected vs unselected state.
   */
  getCardBorderClass(selected: boolean): string {
    if (selected) {
      return 'border border-primary';
    }
    return 'border border-border';
  }

  /**
   * Get complete card container classes.
   */
  getCardContainerClass(selected: boolean): string {
    const baseClasses =
      'rounded-lg bg-card shadow-sm overflow-hidden transition-all';
    const borderClass = this.getCardBorderClass(selected);
    return `${baseClasses} ${borderClass}`;
  }
}

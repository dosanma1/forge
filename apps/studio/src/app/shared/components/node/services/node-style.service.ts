import { Injectable } from '@angular/core';
import { ArchitectureNodeType } from '../../../../features/architecture/models/architecture-node.model';

/**
 * Style configuration for a node type
 * Includes all color-related classes for consistent theming
 */
export interface NodeStyleConfig {
  /** Background color for headers/cards */
  bgClass: string;
  /** Text color for headers */
  textClass: string;
  /** Border color */
  borderClass: string;
  /** Badge styling (for language/framework badges) */
  badgeClass: string;
  /** Ring color for selection state */
  ringClass: string;
  /** Icon color */
  iconClass: string;
}

/**
 * Color scheme identifiers for node styling
 */
export type NodeColorScheme = 'blue' | 'green' | 'purple' | 'gray';

/**
 * Service that provides centralized styling for architecture nodes.
 */
@Injectable({ providedIn: 'root' })
export class NodeStyleService {
  /**
   * Color scheme mapping for each node type
   * service -> blue, app -> green, library -> purple
   */
  private readonly nodeTypeColors: Record<ArchitectureNodeType, NodeColorScheme> =
    {
      service: 'blue',
      app: 'green',
      library: 'purple',
    };

  /**
   * Style configurations for each color scheme
   * Consolidated from various components to ensure consistency
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
   * Get the color scheme for a node type
   */
  getColorScheme(type: ArchitectureNodeType): NodeColorScheme {
    return this.nodeTypeColors[type] ?? 'gray';
  }

  /**
   * Get the full style configuration for a node type
   */
  getStyles(type: ArchitectureNodeType): NodeStyleConfig {
    const scheme = this.getColorScheme(type);
    return this.colorStyles[scheme];
  }

  /**
   * Get the full style configuration for a color scheme
   */
  getStylesByScheme(scheme: NodeColorScheme): NodeStyleConfig {
    return this.colorStyles[scheme];
  }

  /**
   * Get header background class for a node type
   */
  getHeaderBgClass(type: ArchitectureNodeType): string {
    const styles = this.getStyles(type);
    return `${styles.bgClass} ${styles.textClass}`;
  }

  /**
   * Get card header classes including border
   */
  getCardHeaderClass(type: ArchitectureNodeType): string {
    const styles = this.getStyles(type);
    return `${styles.bgClass} ${styles.textClass} ${styles.borderClass}`;
  }

  /**
   * Get badge class for a node type
   * Includes background, text, and ring colors
   */
  getBadgeClass(type: ArchitectureNodeType): string {
    return this.getStyles(type).badgeClass;
  }

  /**
   * Get icon color class for a node type
   */
  getIconClass(type: ArchitectureNodeType): string {
    return this.getStyles(type).iconClass;
  }

  /**
   * Get the combined node color class
   */
  getNodeColorClass(type: ArchitectureNodeType): string {
    const styles = this.getStyles(type);
    return `${styles.iconClass} ${styles.bgClass} ${styles.borderClass}`;
  }

  /**
   * Get selection ring class for a node type
   */
  getSelectionRingClass(type: ArchitectureNodeType): string {
    return this.getStyles(type).ringClass;
  }

  /**
   * Get border class for selected vs unselected state
   */
  getCardBorderClass(type: ArchitectureNodeType, selected: boolean): string {
    if (selected) {
      return 'border border-primary';
    }
    return 'border border-border';
  }

  /**
   * Get complete card container classes
   */
  getCardContainerClass(type: ArchitectureNodeType, selected: boolean): string {
    const baseClasses =
      'rounded-lg bg-card shadow-sm overflow-hidden transition-all';
    const borderClass = this.getCardBorderClass(type, selected);
    return `${baseClasses} ${borderClass}`;
  }
}

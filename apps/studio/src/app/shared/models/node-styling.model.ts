/**
 * Generic node styling types.
 * These provide a color scheme system that any feature can use.
 */

/**
 * Available color schemes for node styling.
 */
export type NodeColorScheme = 'blue' | 'green' | 'purple' | 'gray';

/**
 * Style configuration containing all CSS classes for a color scheme.
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
 * HTTP method type - used for endpoint styling.
 */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * Style configuration for HTTP methods.
 */
export interface HttpMethodStyleConfig {
  badgeClass: string;
  label: string;
  labelFull: string;
}

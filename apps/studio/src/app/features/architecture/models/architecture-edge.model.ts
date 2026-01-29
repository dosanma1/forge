/**
 * Architecture Edge Models
 * These types represent dependencies and connections between architecture nodes.
 */

/**
 * Types of dependencies between nodes
 */
export type DependencyType =
  | 'uses' // Service/App uses a Library
  | 'calls' // Service calls another Service (HTTP/gRPC)
  | 'publishes' // Service publishes events
  | 'consumes' // Service consumes events
  | 'connects'; // Service connects to database/external

/**
 * Edge representing a dependency between nodes
 */
export interface ArchitectureEdge {
  /** Unique identifier for the edge */
  id: string;
  /** Source node ID */
  source: string;
  /** Target node ID */
  target: string;
  /** Source handle ID (optional, for specific connection points) */
  sourceHandle?: string;
  /** Target handle ID (optional, for specific connection points) */
  targetHandle?: string;
  /** Type of dependency */
  dependencyType: DependencyType;
  /** Optional label to display on the edge */
  label?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

// Factory function
export function createEdge(
  source: string,
  target: string,
  dependencyType: DependencyType,
  label?: string,
): ArchitectureEdge {
  return {
    id: `edge-${source}-${target}-${Date.now()}`,
    source,
    target,
    dependencyType,
    label,
  };
}

// Display helpers
export function getEdgeLabel(edge: ArchitectureEdge): string {
  if (edge.label) return edge.label;

  switch (edge.dependencyType) {
    case 'uses':
      return 'uses';
    case 'calls':
      return 'calls';
    case 'publishes':
      return 'publishes';
    case 'consumes':
      return 'consumes';
    case 'connects':
      return 'connects';
  }
}

export function getEdgeStrokeStyle(dependencyType: DependencyType): string {
  switch (dependencyType) {
    case 'uses':
      return 'stroke-purple-400';
    case 'calls':
      return 'stroke-blue-400';
    case 'publishes':
    case 'consumes':
      return 'stroke-orange-400';
    case 'connects':
      return 'stroke-gray-400';
  }
}

export function getEdgeDashArray(dependencyType: DependencyType): string {
  switch (dependencyType) {
    case 'publishes':
    case 'consumes':
      return '5,5'; // Dashed line for async
    default:
      return '0'; // Solid line
  }
}

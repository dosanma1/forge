/**
 * Generic graph types for the graph editor.
 * These types are feature-agnostic and can be used by any feature that needs graph visualization.
 */

export interface IPosition {
  x: number;
  y: number;
}

/**
 * Generic graph node type - features provide their own concrete types.
 */
export type GraphNodeType = string;

/**
 * Generic graph node interface.
 * Features can extend this with additional properties via the data field.
 */
export interface GraphNode {
  id: string;
  name: string;
  type: GraphNodeType;
  positionX: number;
  positionY: number;
  data?: Record<string, unknown>;
}

/**
 * Generic graph edge interface for connections between nodes.
 */
export interface GraphEdge {
  id: string;
  source: string;
  sourceHandle?: string;
  target: string;
  targetHandle?: string;
}

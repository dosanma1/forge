/**
 * Architecture Node Models
 * These types represent services, apps, and libraries in the Architecture Builder
 * and map to forge.json project configurations.
 */

// Node type discriminator
export type ArchitectureNodeType = 'service' | 'app' | 'library';

// Node state - DRAFT nodes are temporary and will be removed if not saved
export type ArchitectureNodeState = 'DRAFT' | 'SAVED';

// Language/framework options (matching forge.json schema)
export type ServiceLanguage = 'go' | 'nestjs';
export type AppFramework = 'angular' | 'react' | 'vue';
export type LibraryLanguage = 'go' | 'typescript';

// Deployer options
export type ServiceDeployer = 'helm' | 'cloudrun';
export type AppDeployer = 'firebase' | 'cloudrun' | 'gke';

// =============================================================================
// Transport Types (for Services)
// =============================================================================

/** Transport type discriminator */
export type TransportType = 'http' | 'grpc' | 'nats';

/** HTTP method types */
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

/**
 * HTTP Endpoint - represents a REST endpoint
 */
export interface HttpEndpoint {
  id: string;
  method: HttpMethod;
  path: string;
  handler: string;
  description?: string;
}

/**
 * HTTP Transport - REST API configuration
 */
export interface HttpTransport {
  type: 'http';
  id: string;
  basePath: string;
  version: string;
  endpoints: HttpEndpoint[];
}

/**
 * gRPC Transport - gRPC service configuration (future)
 */
export interface GrpcTransport {
  type: 'grpc';
  id: string;
  serviceName: string;
  methods: Array<{
    id: string;
    name: string;
    request: string;
    response: string;
  }>;
}

/**
 * NATS Transport - message broker configuration (future)
 */
export interface NatsTransport {
  type: 'nats';
  id: string;
  producers: Array<{
    id: string;
    subject: string;
    message: string;
  }>;
  consumers: Array<{
    id: string;
    subject: string;
    handler: string;
  }>;
}

/** Union type for all transports */
export type ServiceTransport = HttpTransport | GrpcTransport | NatsTransport;

// Transport factory functions
export function createHttpTransport(
  basePath: string = '/api',
  version: string = 'v1',
): HttpTransport {
  return {
    type: 'http',
    id: `http-${Date.now()}`,
    basePath,
    version,
    endpoints: [],
  };
}

export function createHttpEndpoint(
  method: HttpMethod,
  path: string,
  handler: string,
): HttpEndpoint {
  return {
    id: `endpoint-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    method,
    path,
    handler,
  };
}

/**
 * Base interface for all architecture nodes
 */
export interface ArchitectureNodeBase {
  /** Unique identifier for the node */
  id: string;
  /** Project name (kebab-case) */
  name: string;
  /** Optional description */
  description?: string;
  /** X position on canvas */
  positionX: number;
  /** Y position on canvas */
  positionY: number;
  /** Optional tags for categorization */
  tags?: string[];
  /** Node state - DRAFT nodes are temporary until saved */
  state?: ArchitectureNodeState;
}

/**
 * Service node - represents a backend microservice
 */
export interface ServiceNode extends ArchitectureNodeBase {
  type: 'service';
  /** Programming language/framework */
  language: ServiceLanguage;
  /** Deployment target */
  deployer: ServiceDeployer;
  /** Project root path (auto-generated: backend/services/{name}) */
  root?: string;
  /** Optional link to forge.spec.yaml for code generation */
  specPath?: string;
  /** Transport configurations (HTTP, gRPC, NATS) */
  transports?: ServiceTransport[];
}

/**
 * App node - represents a frontend application
 */
export interface AppNode extends ArchitectureNodeBase {
  type: 'app';
  /** Frontend framework */
  framework: AppFramework;
  /** Deployment target */
  deployer: AppDeployer;
  /** Project root path (auto-generated: frontend/apps/{name}) */
  root?: string;
}

/**
 * Library node - represents a shared code library
 */
export interface LibraryNode extends ArchitectureNodeBase {
  type: 'library';
  /** Programming language */
  language: LibraryLanguage;
  /** Project root path (auto-generated: shared/{name}) */
  root?: string;
}

/** Union type for all architecture nodes */
export type ArchitectureNode = ServiceNode | AppNode | LibraryNode;

// Type guards
export function isServiceNode(node: ArchitectureNode): node is ServiceNode {
  return node.type === 'service';
}

export function isAppNode(node: ArchitectureNode): node is AppNode {
  return node.type === 'app';
}

export function isLibraryNode(node: ArchitectureNode): node is LibraryNode {
  return node.type === 'library';
}

// Factory functions
export function createServiceNode(
  name: string,
  language: ServiceLanguage,
  deployer: ServiceDeployer,
  position: { x: number; y: number },
  state: ArchitectureNodeState = 'DRAFT',
): ServiceNode {
  return {
    id: `service-${name}-${Date.now()}`,
    name,
    type: 'service',
    language,
    deployer,
    root: `backend/services/${name}`,
    positionX: position.x,
    positionY: position.y,
    tags: ['backend', 'service'],
    state,
  };
}

export function createAppNode(
  name: string,
  framework: AppFramework,
  deployer: AppDeployer,
  position: { x: number; y: number },
  state: ArchitectureNodeState = 'DRAFT',
): AppNode {
  return {
    id: `app-${name}-${Date.now()}`,
    name,
    type: 'app',
    framework,
    deployer,
    root: `frontend/apps/${name}`,
    positionX: position.x,
    positionY: position.y,
    tags: ['frontend', framework],
    state,
  };
}

export function createLibraryNode(
  name: string,
  language: LibraryLanguage,
  position: { x: number; y: number },
  state: ArchitectureNodeState = 'DRAFT',
): LibraryNode {
  return {
    id: `lib-${name}-${Date.now()}`,
    name,
    type: 'library',
    language,
    root: `shared/${name}`,
    positionX: position.x,
    positionY: position.y,
    tags: ['shared', 'library'],
    state,
  };
}

// Display helpers
export function getNodeIcon(node: ArchitectureNode): string {
  switch (node.type) {
    case 'service':
      return 'lucideServer';
    case 'app':
      return 'lucideMonitor';
    case 'library':
      return 'lucidePackage';
  }
}

export function getNodeBadgeText(node: ArchitectureNode): string {
  switch (node.type) {
    case 'service':
      return node.language === 'go' ? 'Go' : 'NestJS';
    case 'app':
      return node.framework.charAt(0).toUpperCase() + node.framework.slice(1);
    case 'library':
      return node.language === 'go' ? 'Go' : 'TypeScript';
  }
}

export function getNodeColorClass(node: ArchitectureNode): string {
  switch (node.type) {
    case 'service':
      return 'text-blue-500 bg-blue-50 border-blue-200';
    case 'app':
      return 'text-green-500 bg-green-50 border-green-200';
    case 'library':
      return 'text-purple-500 bg-purple-50 border-purple-200';
  }
}

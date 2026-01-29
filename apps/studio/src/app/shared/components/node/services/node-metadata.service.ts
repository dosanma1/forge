import { Injectable } from '@angular/core';
import {
  ArchitectureNodeType,
  ArchitectureNode,
  ServiceNode,
  AppNode,
  LibraryNode,
} from '../../../../features/architecture/models/architecture-node.model';

/**
 * Metadata for a node type including display information
 */
export interface NodeTypeMetadata {
  type: ArchitectureNodeType;
  label: string;
  labelShort: string;
  icon: string;
  description: string;
  defaultRootPath: string;
}

/**
 * Service that provides centralized metadata for architecture nodes.
 */
@Injectable({ providedIn: 'root' })
export class NodeMetadataService {
  private readonly nodeTypeRegistry: Record<ArchitectureNodeType, NodeTypeMetadata> = {
    service: {
      type: 'service',
      label: 'Service',
      labelShort: 'S',
      icon: 'lucideServer',
      description: 'Backend microservice',
      defaultRootPath: 'backend/services',
    },
    app: {
      type: 'app',
      label: 'Application',
      labelShort: 'A',
      icon: 'lucideMonitor',
      description: 'Frontend application',
      defaultRootPath: 'frontend/apps',
    },
    library: {
      type: 'library',
      label: 'Library',
      labelShort: 'L',
      icon: 'lucidePackage',
      description: 'Shared code library',
      defaultRootPath: 'shared',
    },
  };

  /**
   * Get full metadata for a node type
   */
  getMetadata(type: ArchitectureNodeType): NodeTypeMetadata {
    return this.nodeTypeRegistry[type];
  }

  /**
   * Get display label for a node type (e.g., "Service", "Application", "Library")
   */
  getLabel(type: ArchitectureNodeType): string {
    return this.nodeTypeRegistry[type]?.label ?? 'Node';
  }

  /**
   * Get short label for a node type (e.g., "S", "A", "L")
   */
  getLabelShort(type: ArchitectureNodeType): string {
    return this.nodeTypeRegistry[type]?.labelShort ?? 'N';
  }

  /**
   * Get icon name for a node type
   */
  getIcon(type: ArchitectureNodeType): string {
    return this.nodeTypeRegistry[type]?.icon ?? 'lucidePackage';
  }

  /**
   * Get description for a node type
   */
  getDescription(type: ArchitectureNodeType): string {
    return this.nodeTypeRegistry[type]?.description ?? '';
  }

  /**
   * Get default root path prefix for a node type
   */
  getDefaultRootPath(type: ArchitectureNodeType): string {
    return this.nodeTypeRegistry[type]?.defaultRootPath ?? '';
  }

  /**
   * Generate the full root path for a node given its name
   */
  generateRootPath(type: ArchitectureNodeType, name: string): string {
    const basePath = this.getDefaultRootPath(type);
    const kebabName = name.toLowerCase().replace(/\s+/g, '-');
    return `${basePath}/${kebabName}`;
  }

  /**
   * Get the badge text for a node (language/framework display name)
   */
  getBadgeText(node: ArchitectureNode): string {
    switch (node.type) {
      case 'service':
        return this.getServiceLanguageLabel((node as ServiceNode).language);
      case 'app':
        return this.getAppFrameworkLabel((node as AppNode).framework);
      case 'library':
        return this.getLibraryLanguageLabel((node as LibraryNode).language);
      default:
        return 'Unknown';
    }
  }

  /**
   * Get display label for service language
   */
  getServiceLanguageLabel(language: ServiceNode['language']): string {
    const labels: Record<ServiceNode['language'], string> = {
      go: 'Go',
      nestjs: 'NestJS',
    };
    return labels[language] ?? language;
  }

  /**
   * Get display label for app framework
   */
  getAppFrameworkLabel(framework: AppNode['framework']): string {
    const labels: Record<AppNode['framework'], string> = {
      angular: 'Angular',
      react: 'React',
      vue: 'Vue',
    };
    return labels[framework] ?? framework;
  }

  /**
   * Get display label for library language
   */
  getLibraryLanguageLabel(language: LibraryNode['language']): string {
    const labels: Record<LibraryNode['language'], string> = {
      go: 'Go',
      typescript: 'TypeScript',
    };
    return labels[language] ?? language;
  }

  /**
   * Get deployer display label
   */
  getDeployerLabel(
    deployer: ServiceNode['deployer'] | AppNode['deployer'],
  ): string {
    const labels: Record<string, string> = {
      helm: 'Helm/GKE',
      cloudrun: 'Cloud Run',
      firebase: 'Firebase',
      gke: 'GKE',
    };
    return labels[deployer] ?? deployer ?? 'N/A';
  }

  /**
   * Get all node types for iteration (e.g., in palettes/drawers)
   */
  getAllTypes(): ArchitectureNodeType[] {
    return ['service', 'app', 'library'];
  }

  /**
   * Get all metadata entries for iteration
   */
  getAllMetadata(): NodeTypeMetadata[] {
    return this.getAllTypes().map((type) => this.getMetadata(type));
  }
}

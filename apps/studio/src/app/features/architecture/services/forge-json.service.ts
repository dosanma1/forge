import { inject, Injectable } from '@angular/core';
import { LogService } from '@forge/log';
import * as WailsProject from '../../../wailsjs/github.com/dosanma1/forge/apps/studio/projectservice';
import {
  ArchitectureNode,
  ServiceNode,
  AppNode,
  LibraryNode,
  ServiceLanguage,
  ServiceDeployer,
  AppFramework,
  AppDeployer,
  LibraryLanguage,
} from '../models/architecture-node.model';

/**
 * Represents a project in forge.json
 */
interface ForgeProject {
  projectType: 'service' | 'application' | 'library';
  language?: string;
  framework?: string;
  root: string;
  tags?: string[];
  description?: string;
  architect?: {
    build?: {
      builder?: string;
      options?: Record<string, unknown>;
      configurations?: Record<string, unknown>;
      defaultConfiguration?: string;
    };
    deploy?: {
      deployer?: string;
      options?: Record<string, unknown>;
      configurations?: Record<string, unknown>;
      defaultConfiguration?: string;
    };
  };
  metadata?: {
    deployment?: {
      target?: string;
    };
    position?: {
      x: number;
      y: number;
    };
  };
}

/**
 * Represents the forge.json structure
 */
interface ForgeConfig {
  $schema?: string;
  version: string;
  workspace: {
    name: string;
    forgeVersion: string;
    toolVersions?: Record<string, string>;
    github?: {
      org: string;
    };
    gazelleDirectives?: string[];
  };
  newProjectRoot?: string;
  projects: Record<string, ForgeProject>;
}

/**
 * Service for reading and writing forge.json files
 */
@Injectable({ providedIn: 'root' })
export class ForgeJsonService {
  private readonly logger = inject(LogService);

  /**
   * Load architecture nodes from forge.json
   */
  async loadFromForgeJson(workspacePath: string): Promise<ArchitectureNode[]> {
    try {
      const forgeJsonPath = `${workspacePath}/forge.json`;
      const content = await WailsProject.ReadFile(forgeJsonPath);
      const config: ForgeConfig = JSON.parse(content);

      const nodes: ArchitectureNode[] = [];
      let index = 0;

      for (const [name, project] of Object.entries(config.projects)) {
        const node = this.projectToNode(name, project, index);
        if (node) {
          nodes.push(node);
          index++;
        }
      }

      return nodes;
    } catch (err) {
      this.logger.error('Failed to load forge.json', err);
      throw err;
    }
  }

  /**
   * Save architecture nodes to forge.json
   */
  async saveToForgeJson(
    workspacePath: string,
    nodes: ArchitectureNode[],
  ): Promise<void> {
    try {
      const forgeJsonPath = `${workspacePath}/forge.json`;

      // Read existing config to preserve workspace settings
      let config: ForgeConfig;
      try {
        const content = await WailsProject.ReadFile(forgeJsonPath);
        config = JSON.parse(content);
      } catch {
        // Create new config if file doesn't exist
        config = this.createDefaultConfig(workspacePath);
      }

      // Update projects from nodes
      config.projects = {};
      for (const node of nodes) {
        const project = this.nodeToProject(node);
        config.projects[node.name] = project;
      }

      // Write back to file
      const content = JSON.stringify(config, null, 2);
      await WailsProject.WriteFile(forgeJsonPath, content);
    } catch (err) {
      this.logger.error('Failed to save forge.json', err);
      throw err;
    }
  }

  /**
   * Convert a forge.json project to an ArchitectureNode
   */
  private projectToNode(
    name: string,
    project: ForgeProject,
    index: number,
  ): ArchitectureNode | null {
    // Calculate default position based on index
    const defaultPosition = {
      x: 100 + (index % 3) * 350,
      y: 100 + Math.floor(index / 3) * 250,
    };

    const position = project.metadata?.position ?? defaultPosition;

    const baseNode = {
      id: `node-${name}`,
      name,
      description: project.description,
      positionX: position.x,
      positionY: position.y,
      root: project.root,
      tags: project.tags,
      state: 'SAVED' as const,
    };

    switch (project.projectType) {
      case 'service': {
        const serviceNode: ServiceNode = {
          ...baseNode,
          type: 'service',
          language: this.parseServiceLanguage(project.language),
          deployer: this.parseServiceDeployer(project.architect?.deploy?.deployer),
        };
        return serviceNode;
      }

      case 'application': {
        const appNode: AppNode = {
          ...baseNode,
          type: 'app',
          framework: this.parseAppFramework(project.framework || project.language),
          deployer: this.parseAppDeployer(project.architect?.deploy?.deployer),
        };
        return appNode;
      }

      case 'library': {
        const libraryNode: LibraryNode = {
          ...baseNode,
          type: 'library',
          language: this.parseLibraryLanguage(project.language),
        };
        return libraryNode;
      }

      default:
        this.logger.warn(`Unknown project type: ${project.projectType}`);
        return null;
    }
  }

  /**
   * Convert an ArchitectureNode to a forge.json project
   */
  private nodeToProject(node: ArchitectureNode): ForgeProject {
    const baseProject: ForgeProject = {
      projectType: this.nodeTypeToProjectType(node.type),
      root: node.root ?? this.getDefaultRoot(node),
      tags: node.tags,
      description: node.description,
      metadata: {
        position: {
          x: node.positionX,
          y: node.positionY,
        },
      },
    };

    switch (node.type) {
      case 'service': {
        const serviceNode = node as ServiceNode;
        return {
          ...baseProject,
          language: serviceNode.language,
          architect: {
            build: this.getDefaultBuildConfig(serviceNode),
            deploy: this.getDefaultDeployConfig(serviceNode),
          },
        };
      }

      case 'app': {
        const appNode = node as AppNode;
        return {
          ...baseProject,
          framework: appNode.framework,
          architect: {
            build: this.getDefaultAppBuildConfig(appNode),
            deploy: this.getDefaultAppDeployConfig(appNode),
          },
        };
      }

      case 'library': {
        const libraryNode = node as LibraryNode;
        return {
          ...baseProject,
          language: libraryNode.language,
          architect: {
            build: {
              builder: '@forge/bazel:build',
              options: { target: '/...' },
              configurations: {
                development: {},
                local: {},
                production: {},
              },
              defaultConfiguration: 'production',
            },
          },
        };
      }
    }
  }

  private nodeTypeToProjectType(
    type: 'service' | 'app' | 'library',
  ): 'service' | 'application' | 'library' {
    if (type === 'app') return 'application';
    return type;
  }

  private getDefaultRoot(node: ArchitectureNode): string {
    switch (node.type) {
      case 'service':
        return `backend/services/${node.name}`;
      case 'app':
        return `frontend/apps/${node.name}`;
      case 'library':
        return `shared/${node.name}`;
    }
  }

  private parseServiceLanguage(language?: string): ServiceLanguage {
    if (language === 'nestjs') return 'nestjs';
    return 'go';
  }

  private parseServiceDeployer(deployer?: string): ServiceDeployer {
    if (deployer?.includes('cloudrun')) return 'cloudrun';
    return 'helm';
  }

  private parseAppFramework(framework?: string): AppFramework {
    if (framework === 'react') return 'react';
    if (framework === 'vue') return 'vue';
    return 'angular';
  }

  private parseAppDeployer(deployer?: string): AppDeployer {
    if (deployer?.includes('cloudrun')) return 'cloudrun';
    if (deployer?.includes('gke')) return 'gke';
    return 'firebase';
  }

  private parseLibraryLanguage(language?: string): LibraryLanguage {
    if (language === 'typescript') return 'typescript';
    return 'go';
  }

  private getDefaultBuildConfig(node: ServiceNode) {
    return {
      builder: '@forge/bazel:build',
      options: {
        dockerfile: 'Dockerfile',
        goVersion: '1.24.0',
        registry: 'gcr.io/your-project',
        target: '/...',
      },
      configurations: {
        development: {},
        local: { race: false, registry: 'gcr.io/your-project' },
        production: { optimization: true, registry: 'gcr.io/your-project' },
      },
      defaultConfiguration: 'production',
    };
  }

  private getDefaultDeployConfig(node: ServiceNode) {
    const deployer =
      node.deployer === 'cloudrun'
        ? '@forge/cloudrun:deploy'
        : '@forge/helm:deploy';

    return {
      deployer,
      options:
        node.deployer === 'helm'
          ? { chartPath: 'deploy/helm', namespace: 'default' }
          : {},
      configurations: {
        development: { namespace: 'default' },
        local: { namespace: 'default' },
        production: { namespace: 'default' },
      },
      defaultConfiguration: 'production',
    };
  }

  private getDefaultAppBuildConfig(node: AppNode) {
    const builder =
      node.framework === 'angular'
        ? '@angular-devkit/build-angular:browser'
        : '@forge/webpack:build';

    return {
      builder,
      options: {},
      configurations: {
        development: {},
        production: { optimization: true },
      },
      defaultConfiguration: 'production',
    };
  }

  private getDefaultAppDeployConfig(node: AppNode) {
    let deployer = '@forge/firebase:deploy';
    if (node.deployer === 'cloudrun') deployer = '@forge/cloudrun:deploy';
    if (node.deployer === 'gke') deployer = '@forge/gke:deploy';

    return {
      deployer,
      configurations: {
        development: {},
        production: {},
      },
      defaultConfiguration: 'production',
    };
  }

  private createDefaultConfig(workspacePath: string): ForgeConfig {
    const workspaceName = workspacePath.split('/').pop() || 'workspace';

    return {
      $schema:
        'https://raw.githubusercontent.com/dosanma1/forge-cli/main/schemas/forge-config.v1.schema.json',
      version: '1',
      workspace: {
        name: workspaceName,
        forgeVersion: '1.0.0',
        toolVersions: {
          go: '1.24.0',
        },
      },
      newProjectRoot: '.',
      projects: {},
    };
  }
}
